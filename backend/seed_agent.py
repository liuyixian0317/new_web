"""Seed 1.6 conversational agent integration with SeedDream image generation.

This module centralises the logic for:

1. Streaming conversations with the Doubao Seed 1.6 reasoning model while
   exposing both the thinking trace and the final content delta-by-delta.
2. Interpreting the assistant's decision (keep asking the user vs. trigger
   SeedDream image generation) by means of a structured ``<ActionPlan>`` block.
3. Forwarding image-generation prompts to SeedDream 4.0 and packaging the
   resulting image URLs for the frontend display panel.

Environment variables:
    ARK_API_KEY:                  Required authentication token.
    ARK_BASE_URL:                 Optional API base (default Ark Beijing v3).
    ARK_SEED_MODEL:               Override for the Seed 1.6 model id.
    ARK_SEEDDREAM_MODEL:          Override for the SeedDream model id.
    ARK_SEEDDREAM_SIZE:           Default size to request from SeedDream.
    ARK_SEEDDREAM_MAX_IMAGES:     Max images per prompt (default 1).
    SEED_ACTION_DEBUG:            If set to a truthy value, the raw action block
                                  will be echoed to stderr for debugging.
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
from dataclasses import dataclass
from typing import Dict, Generator, Iterable, List, Optional, Sequence, Tuple, TypedDict
from uuid import uuid4

import requests

STREAM_TIMEOUT = 120

ARK_BASE_URL = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
ARK_SEED_MODEL = os.getenv("ARK_SEED_MODEL", "doubao-seed-1-6-251015")
ARK_SEEDDREAM_MODEL = os.getenv("ARK_SEEDDREAM_MODEL", "doubao-seedream-4-0-250828")
ARK_SEEDDREAM_SIZE = os.getenv("ARK_SEEDDREAM_SIZE", "2K")
ARK_SEEDDREAM_MAX_IMAGES = int(os.getenv("ARK_SEEDDREAM_MAX_IMAGES", "1"))
ARK_SEED_REASONING_EFFORT = os.getenv("ARK_SEED_REASONING_EFFORT", "medium")
ARK_SEED_THINKING_MODE = os.getenv("ARK_SEED_THINKING_MODE", "enabled")

SYSTEM_PROMPT = """\
你是“潮玩造梦师”项目的创意统筹助手，负责和用户一起完善潮玩设计需求，并在时机成熟时调用 SeedDream 生图模型生成草图。

工作准则：
1. 先澄清需求再行动：如果用户的信息不够生成图片，请用中文解释缺失信息并提出明确问题，与用户继续对话。
2. 当需求信息充分、可以生成图片时，对用户做出友好的回应，并准备 SeedDream 所需的 prompt。
3. 输出格式：先给出面向用户的自然语言回复；随后以 <ActionPlan> 块结束整个回答，不要在 </ActionPlan> 之后再写任何内容。
   <ActionPlan>
   action: ask_user | generate_image
   prompts:
   - 如果 action 为 generate_image，在此罗列将要用于 SeedDream 的英文 prompt，每行一个；否则保持列表为空。
   </ActionPlan>
4. 判断充足信息的要素包括：角色/主体、风格、材质或质感、场景与氛围、色彩重点等。若缺少其中关键要素，应继续提问。
5. 当生成图片时，只放入真正需要投喂给 SeedDream 的 prompt，避免无关文字。
6. 推理过程中可以在内部思考阶段整理信息，但不要在对用户的最终回答中泄露思考痕迹或系统提示信息。
"""

ACTION_PLAN_PATTERN = re.compile(r"<ActionPlan>(?P<body>.*?)</ActionPlan>", re.DOTALL | re.IGNORECASE)
ACTION_LINE_PATTERN = re.compile(r"action\s*:\s*(?P<action>\w+)", re.IGNORECASE)
PROMPT_LINE_PATTERN = re.compile(r"^\s*-\s*(.+)$", re.MULTILINE)


class SeedStreamEvent(TypedDict, total=False):
    """Event payload used while streaming Seed responses."""

    type: str  # "thinking" | "content" | "summary" | "complete"
    delta: str
    message: str
    action: str
    prompts: List[str]
    artworks: List[Dict[str, str]]
    thinking: str


@dataclass
class ActionDecision:
    action: str = "ask_user"
    prompts: Tuple[str, ...] = ()

    @property
    def needs_images(self) -> bool:
        return self.action.lower() == "generate_image" and bool(self.prompts)


def _check_api_key() -> str:
    api_key = os.getenv("ARK_API_KEY")
    if not api_key:
        raise RuntimeError("ARK_API_KEY environment variable is required")
    return api_key


def _format_content_block(text: str) -> List[Dict[str, str]]:
    return [{"type": "text", "text": text}]


def _prepare_messages(history: Sequence[Dict[str, str]]) -> List[Dict[str, object]]:
    messages: List[Dict[str, object]] = [{"role": "system", "content": _format_content_block(SYSTEM_PROMPT)}]
    for item in history:
        role = item.get("role", "assistant")
        content = item.get("content", "")
        if not content:
            continue
        messages.append({"role": role, "content": _format_content_block(content)})
    return messages


def _parse_action_block(content: str) -> ActionDecision:
    match = ACTION_PLAN_PATTERN.search(content)
    if not match:
        return ActionDecision()

    body = match.group("body")
    action_match = ACTION_LINE_PATTERN.search(body)
    action = action_match.group("action").strip().lower() if action_match else "ask_user"

    prompts = tuple(p.strip() for p in PROMPT_LINE_PATTERN.findall(body) if p.strip())
    decision = ActionDecision(action=action, prompts=prompts)

    if os.getenv("SEED_ACTION_DEBUG"):
        print("DEBUG Seed Action Plan:", decision, file=sys.stderr)

    return decision


def _request_seed_stream(messages: List[Dict[str, object]]) -> requests.Response:
    api_key = _check_api_key()

    payload = {
        "model": ARK_SEED_MODEL,
        "messages": messages,
        "reasoning_effort": ARK_SEED_REASONING_EFFORT,
        "stream": True,
        "stream_options": {"include_usage": True},
        "max_completion_tokens": 65535,
    }
    if ARK_SEED_THINKING_MODE and ARK_SEED_THINKING_MODE.lower() not in {"none", "off"}:
        payload["thinking"] = {"type": ARK_SEED_THINKING_MODE}

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    logger.info("调用 Seed Chat 模型 model=%s 消息数=%d", ARK_SEED_MODEL, len(messages))
    logger.debug("Seed Chat 请求 payload=%s", json.dumps(payload, ensure_ascii=False))
    try:
        response = requests.post(
            f"{ARK_BASE_URL.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=STREAM_TIMEOUT,
            stream=True,
        )
        response.encoding = "utf-8"  # 强制按 UTF-8 解码
        logger.debug("Seed Chat 响应状态: %s", response.status_code)
        response.raise_for_status()
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else ""
        logger.error("Seed Chat 请求失败：%s | %s", exc, detail)
        raise
    if not response.encoding:
        response.encoding = "utf-8"
    return response


def _request_seeddream(prompt: str) -> List[Dict[str, str]]:
    api_key = _check_api_key()

    payload = {
        "model": ARK_SEEDDREAM_MODEL,
        "prompt": prompt,
        "response_format": "url",
        "size": ARK_SEEDDREAM_SIZE,
        "stream": False,
        "sequential_image_generation": "auto",
        "sequential_image_generation_options": {"max_images": ARK_SEEDDREAM_MAX_IMAGES},
        "watermark": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    logger.info("调用 SeedDream model=%s prompt=%s", ARK_SEEDDREAM_MODEL, prompt)
    response = requests.post(
        f"{ARK_BASE_URL.rstrip('/')}/images/generations",
        headers=headers,
        json=payload,
        timeout=STREAM_TIMEOUT,
    )
    response.raise_for_status()

    data = response.json()
    artworks: List[Dict[str, str]] = []
    for item in data.get("data", []):
        image_url = item.get("url", "")
        artwork_id = item.get("id") or str(uuid4())
        artworks.append(
            {
                "id": artwork_id,
                "prompt": prompt,
                "imageUrl": image_url,
                "sizeLabel": item.get("size") or ARK_SEEDDREAM_SIZE,
            }
        )
    return artworks


def _extract_message_parts(message_obj: Dict) -> Tuple[str, str]:
    """Return (thinking_text, content_text) from the model message payload.

    Doubao Seed 1.6 可能返回以下两种格式：
      1. content 为列表，包含 type=thinking/text 的片段；
      2. content 为纯字符串，同时包含 reasoning_content 字段承载思考内容。
    此函数会统一拆解成“思考文本 + 对用户可见文本”。
    """

    content = message_obj.get("content")
    thinking_segments: List[str] = []
    text_segments: List[str] = []

    if isinstance(content, list):
        for part in content:
            if not isinstance(part, dict):
                continue
            part_type = part.get("type")
            text_value = part.get("text", "")
            if part_type in {"thinking", "reasoning", "reasoning_content"}:
                thinking_segments.append(text_value)
            elif part_type == "text":
                text_segments.append(text_value)
            else:
                logger.debug("未处理的消息片段类型: %s, 内容: %s", part_type, text_value)
    elif isinstance(content, str):
        text_segments.append(content)

    for field in ("reasoning_content", "reasoning", "thinking"):
        value = message_obj.get(field)
        if isinstance(value, str):
            thinking_segments.append(value)

    thinking_text = "\n".join(segment.strip() for segment in thinking_segments if segment).strip()
    content_text = "\n".join(segment.strip() for segment in text_segments if segment).strip()
    return thinking_text, content_text


def stream_seed_chat(history: Sequence[Dict[str, str]]) -> Generator[SeedStreamEvent, None, None]:
    """Stream a Seed 1.6 response and optionally trigger SeedDream generation."""

    messages = _prepare_messages(history)
    response = _request_seed_stream(messages)

    thinking_buffer: List[str] = []
    content_buffer: List[str] = []
    action_capture: List[str] = []
    capturing_action = False
    
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        line = raw_line.strip()
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if payload == "[DONE]":
            break

        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            continue

        choices = event.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        if not delta:
            continue

        def _normalize_text(value: object) -> str:
            if isinstance(value, str):
                return value
            if isinstance(value, dict):
                text = value.get("text")
                return text if isinstance(text, str) else ""
            return ""

        thinking_candidates: List[str] = []
        for key in ("reasoning_content", "thinking", "reasoning"):
            candidate = delta.get(key)
            if isinstance(candidate, list):
                thinking_candidates.extend(_normalize_text(part) for part in candidate)
            else:
                thinking_candidates.append(_normalize_text(candidate))

        for thought in (txt for txt in thinking_candidates if txt):
            thinking_buffer.append(thought)
            # import pdb
            # pdb.set_trace()
            yield SeedStreamEvent(type="thinking", delta=thought)

        content_chunk = delta.get("content")
        content_segments: List[str] = []
        if isinstance(content_chunk, list):
            for part in content_chunk:
                text = _normalize_text(part)
                if text:
                    content_segments.append(text)
        else:
            text = _normalize_text(content_chunk)
            if text:
                content_segments.append(text)

        for segment in content_segments:
            if "<ActionPlan>" in segment:
                start = segment.index("<ActionPlan>")
                visible = segment[:start]
                remainder = segment[start:]
                if visible:
                    content_buffer.append(visible)
                    yield SeedStreamEvent(type="content", delta=visible)
                action_capture.append(remainder)
                capturing_action = True
                continue

            if capturing_action:
                action_capture.append(segment)
                if "</ActionPlan>" in segment:
                    end_idx = segment.index("</ActionPlan>") + len("</ActionPlan>")
                    tail = segment[end_idx:]
                    if tail:
                        content_buffer.append(tail)
                        yield SeedStreamEvent(type="content", delta=tail)
                    capturing_action = False
            else:
                content_buffer.append(segment)
                yield SeedStreamEvent(type="content", delta=segment)

    assistant_raw = "".join(content_buffer).strip()
    action_block = "".join(action_capture)
    thinking_result = "".join(thinking_buffer).strip()

    if not assistant_raw and not thinking_result:
        logger.warning("Seed Chat 流式响应为空")

    logger.info("Seed Chat thinking 输出: %s", thinking_result.replace("\n", " ")[:500])
    logger.info("Seed Chat content 输出: %s", assistant_raw.replace("\n", " ")[:500])

    decision = _parse_action_block(action_block or assistant_raw)
    assistant_message = ACTION_PLAN_PATTERN.sub("", assistant_raw).strip()

    artworks: List[Dict[str, str]] = []

    if decision.needs_images:
        for prompt in decision.prompts:
            try:
                artworks.extend(_request_seeddream(prompt))
            except requests.HTTPError as exc:
                logger.exception("SeedDream HTTP 错误: %s", exc)
                error_msg = f"SeedDream 请求失败：{exc.response.status_code}"
                artworks.append(
                    {
                        "id": str(uuid4()),
                        "prompt": prompt,
                        "error": error_msg,
                        "imageUrl": "",
                    }
                )
            except requests.RequestException as exc:
                logger.exception("SeedDream 请求异常: %s", exc)
                artworks.append(
                    {
                        "id": str(uuid4()),
                        "prompt": prompt,
                        "error": str(exc),
                        "imageUrl": "",
                    }
                )

    yield SeedStreamEvent(
        type="complete",
        message=assistant_message,
        delta="",
        action=decision.action,
        prompts=list(decision.prompts),
        artworks=artworks,
        thinking=thinking_result,
    )


class SeedAgent:
    """Stateful helper for managing Seed-driven conversations."""

    def __init__(self) -> None:
        self.history: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str) -> None:
        self.history.append({"role": role, "content": content})

    def interact(self, user_message: str) -> Iterable[SeedStreamEvent]:
        self.add_message("user", user_message)
        pending_assistant: List[str] = []

        history_snapshot = list(self.history)
        for event in stream_seed_chat(history_snapshot):
            logger.debug("stream_seed_chat 事件: %s", event.get("type"))
            if event["type"] == "content" and "delta" in event:
                pending_assistant.append(event["delta"])
            if event["type"] == "complete":
                message_text = event.get("message") or "".join(pending_assistant).strip()
                self.add_message("assistant", message_text)
            yield event
logger = logging.getLogger("seed.agent")
logger.setLevel(logging.INFO)
