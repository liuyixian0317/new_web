"""FastAPI backend wiring for the Seed 1.6 conversational agent."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from uuid import uuid4

from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .seed_agent import SeedAgent


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_LOGGING_CONFIGURED = False


def _configure_logging() -> None:
    global _LOGGING_CONFIGURED
    if _LOGGING_CONFIGURED:
        return

    log_dir = Path(__file__).resolve().parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "seed_agent.log"

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S"
    )

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    for logger_name in ("seed.backend", "seed.agent"):
        target_logger = logging.getLogger(logger_name)
        target_logger.setLevel(logging.INFO)
        target_logger.propagate = False

        existing = target_logger.handlers
        has_file = any(
            isinstance(handler, RotatingFileHandler)
            and getattr(handler, "baseFilename", None) == str(log_file)
            for handler in existing
        )
        has_stream = any(isinstance(handler, logging.StreamHandler) for handler in existing)

        if not has_file:
            target_logger.addHandler(file_handler)
        if not has_stream:
            target_logger.addHandler(stream_handler)

    _LOGGING_CONFIGURED = True


_configure_logging()


class SessionState:
    def __init__(self, prompt: str, notes: Optional[str], locale: Optional[str]) -> None:
        self.id = str(uuid4())
        self.initial_prompt = prompt
        self.notes = notes
        self.locale = locale
        self.created_at = utc_now_iso()
        self.status = "collecting"
        self.reference_image_url: Optional[str] = None
        self.plan: List[dict] = []
        self.messages: List[Dict] = []
        self.generated_artworks: List[Dict] = []
        self.knowledge_references: List[str] = []
        self.final_prompt: Optional[str] = None
        self.agent = SeedAgent()

    def as_summary(self) -> Dict:
        return {
            "id": self.id,
            "initialPrompt": self.initial_prompt,
            "createdAt": self.created_at,
            "status": self.status,
            "referenceImageUrl": self.reference_image_url,
            "notes": self.notes,
        }

    def as_detail(self) -> Dict:
        return {
            **self.as_summary(),
            "plan": self.plan,
            "messages": self.messages,
            "knowledgeReferences": self.knowledge_references,
            "finalPrompt": self.final_prompt,
            "generatedArtworks": self.generated_artworks,
        }


logger = logging.getLogger("seed.backend")
logger.setLevel(logging.INFO)

app = FastAPI(title="Seed Agent Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS: Dict[str, SessionState] = {}


@app.post("/api/agent/sessions")
async def create_session(
    prompt: str = Form(...),
    notes: Optional[str] = Form(None),
    locale: Optional[str] = Form(None),
    referenceImage: Optional[UploadFile] = None,
):
    logger.info("创建会话，初始 prompt=%s locale=%s", prompt, locale)
    session = SessionState(prompt=prompt, notes=notes, locale=locale)
    if referenceImage is not None:
        # TODO: persist the file and assign a URL accessible by the frontend.
        session.reference_image_url = None
    SESSIONS[session.id] = session
    return JSONResponse(session.as_summary())


def get_session_or_404(session_id: str) -> SessionState:
    try:
        return SESSIONS[session_id]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="会话不存在") from exc


@app.get("/api/agent/sessions/{session_id}")
async def get_session_detail(session_id: str):
    session = get_session_or_404(session_id)
    logger.debug("获取会话详情 session_id=%s", session_id)
    return JSONResponse(session.as_detail())


@app.get("/api/agent/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    session = get_session_or_404(session_id)
    logger.debug("获取会话消息 session_id=%s, count=%d", session_id, len(session.messages))
    return JSONResponse(session.messages)


def _append_message(session: SessionState, role: str, content: str, **extras: object) -> Dict:
    message = {
        "id": f"{role}-{uuid4()}",
        "role": role,
        "content": content,
        "createdAt": utc_now_iso(),
    }
    message.update({k: v for k, v in extras.items() if v is not None})
    session.messages.append(message)
    return message


def _merge_artworks(session: SessionState, artworks: Optional[Iterable[Dict]]) -> None:
    if not artworks:
        return
    existing = {item["id"]: item for item in session.generated_artworks if "id" in item}
    for artwork in artworks:
        artwork_id = artwork.get("id") or str(uuid4())
        combined = {**existing.get(artwork_id, {}), **artwork, "id": artwork_id}
        existing[artwork_id] = combined
    session.generated_artworks = list(existing.values())


@app.post("/api/agent/sessions/{session_id}/messages")
async def send_message(session_id: str, message: str = Form(...)):
    session = get_session_or_404(session_id)
    logger.info("收到用户消息 session_id=%s message=%s", session_id, message)
    _append_message(session, "user", message)

    async def event_stream():
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[Optional[Dict]] = asyncio.Queue()

        def run_agent():
            try:
                for event in session.agent.interact(message):
                    asyncio.run_coroutine_threadsafe(queue.put(event), loop)
            except Exception as exc:  # pragma: no cover
                logger.exception("Agent 处理消息失败: %s", exc)
                asyncio.run_coroutine_threadsafe(queue.put({"type": "error", "message": str(exc)}), loop)
            finally:
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        loop.run_in_executor(None, run_agent)

        while True:
            event = await queue.get()
            if event is None:
                break
            if event.get("type") == "error":
                logger.error("Agent 返回错误事件: %s", event)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                continue

            payload = dict(event)
            sse_payload = f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
            logger.debug("Agent 流事件: %s", payload.get("type"))

            if event["type"] == "complete":
                assistant_message = event.get("message", "")
                thinking = event.get("thinking")
                prompts = event.get("prompts")
                action = event.get("action")
                logger.info(
                    "Agent 完成响应 session_id=%s action=%s prompts=%s",
                    session_id,
                    action,
                    prompts,
                )
                _append_message(
                    session,
                    "assistant",
                    assistant_message,
                    thinkingTrace=thinking,
                    action=action,
                    prompts=prompts,
                )
                _merge_artworks(session, event.get("artworks"))

            yield sse_payload

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/agent/sessions/{session_id}/finalize")
async def finalize_session(session_id: str):
    session = get_session_or_404(session_id)
    session.status = "finalized"
    # In a real backend you might consolidate prompts here.
    return JSONResponse(
        {
            "session": session.as_detail(),
            "finalPrompt": session.final_prompt or session.initial_prompt,
            "generatedArtworks": session.generated_artworks,
        }
    )


@app.get("/healthz")
async def health_check():
    return {"status": "ok"}
