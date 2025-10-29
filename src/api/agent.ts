import type {
  AgentSessionSummary,
  AgentSessionDetail,
  CreateSessionRequest,
  SendAgentMessageRequest,
  AgentMessage,
  FinalizeSessionResponse,
  GeneratedArtwork,
  KnowledgeEntry
} from "../types";
import {
  mockCreateAgentSession,
  mockFetchKnowledgeBase,
  mockFetchSessionDetail,
  mockFetchSessionMessages,
  mockFinalizeAgentSession,
  mockSendAgentMessage
} from "./mockAgent";

export type AgentStreamEventType = "thinking" | "content" | "action_plan" | "complete";

export interface AgentStreamEvent {
  type: AgentStreamEventType;
  delta?: string;
  message?: string;
  action?: string;
  prompts?: string[];
  artworks?: GeneratedArtwork[];
  thinking?: string;
  requestedCount?: number;
  size?: string;
}

export interface AgentStreamCallbacks {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
  onActionPlan?: (prompts: string[], thinking: string | undefined, action: string | undefined, size: string | undefined) => void;
  onComplete: (event: AgentStreamEvent) => void;
  onError?: (error: Error) => void;
}

const API_BASE = (import.meta.env.VITE_AGENT_API_BASE || "/api/agent").replace(/\/$/, "");
const envMockFlag = import.meta.env.VITE_AGENT_USE_MOCK;
const defaultMock = import.meta.env.MODE !== "production";
const useMockAgent = envMockFlag === "true" || (envMockFlag !== "false" && defaultMock);

const jsonHeaders = {
  Accept: "application/json"
};

const buildErrorMessage = async (response: Response) => {
  let fallback = `请求失败：${response.status}`;
  if (response.status === 404) {
    fallback = "Agent 服务未找到（404）。请确认已启动 Python 后端或开启 VITE_AGENT_USE_MOCK。";
  } else if (response.status >= 500) {
    fallback = "Agent 服务异常，请稍后重试。";
  }

  try {
    const errorBody = await response.json();
    if (errorBody && typeof errorBody.message === "string") {
      return errorBody.message;
    }
  } catch {
    // ignore json parse error
  }
  return fallback;
};

const checkResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await buildErrorMessage(response);
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export const createAgentSession = async (payload: CreateSessionRequest): Promise<AgentSessionSummary> => {
  if (useMockAgent) {
    return mockCreateAgentSession(payload);
  }

  const form = new FormData();
  form.append("prompt", payload.prompt);
  if (payload.requestedCount) {
    form.append("requestedCount", String(payload.requestedCount));
  }
  if (payload.notes) form.append("notes", payload.notes);
  if (payload.locale) form.append("locale", payload.locale);
  if (payload.referenceImage) {
    form.append("referenceImage", payload.referenceImage);
  }

  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    body: form
  });

  return checkResponse<AgentSessionSummary>(response);
};

export const fetchSessionDetail = async (sessionId: string): Promise<AgentSessionDetail> => {
  if (useMockAgent) {
    return mockFetchSessionDetail(sessionId);
  }

  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "GET",
    headers: jsonHeaders
  });

  return checkResponse<AgentSessionDetail>(response);
};

export const fetchSessionMessages = async (sessionId: string): Promise<AgentMessage[]> => {
  if (useMockAgent) {
    return mockFetchSessionMessages(sessionId);
  }

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: "GET",
    headers: jsonHeaders
  });
  return checkResponse<AgentMessage[]>(response);
};

export const sendAgentMessage = async (
  sessionId: string,
  payload: SendAgentMessageRequest
): Promise<{ message: AgentMessage; plan?: AgentSessionDetail["plan"]; artworks?: GeneratedArtwork[] }> => {
  if (useMockAgent) {
    return mockSendAgentMessage(sessionId, payload);
  }

  const form = new FormData();
  form.append("message", payload.message);
  if (payload.requestedCount) {
    form.append("requestedCount", String(payload.requestedCount));
  }
  payload.attachments?.forEach((file, index) => {
    form.append(`attachment_${index}`, file);
  });

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: "POST",
    body: form
  });

  return checkResponse<{ message: AgentMessage; plan?: AgentSessionDetail["plan"]; artworks?: GeneratedArtwork[] }>(
    response
  );
};

export const streamAgentMessage = async (
  sessionId: string,
  payload: SendAgentMessageRequest,
  callbacks: AgentStreamCallbacks
): Promise<void> => {
  if (useMockAgent) {
    try {
      const result = await mockSendAgentMessage(sessionId, payload);
      const content = result.message.content;
      callbacks.onThinkingDelta?.("（模拟）Agent 正在思考…\n");
      callbacks.onContentDelta?.(content);
      if (callbacks.onActionPlan) {
        callbacks.onActionPlan(result.message.prompts ?? [], result.message.thinkingTrace, result.message.action, undefined);
      }
      callbacks.onComplete({
        type: "complete",
        message: content,
        action: "ask_user",
        prompts: [],
        artworks: result.artworks ?? [],
        thinking: "模拟环境下未启用 Seed 思考流。",
      });
    } catch (error) {
      if (callbacks.onError && error instanceof Error) {
        callbacks.onError(error);
      } else {
        throw error;
      }
    }
    return;
  }

  const form = new FormData();
  form.append("message", payload.message);
  if (payload.requestedCount) {
    form.append("requestedCount", String(payload.requestedCount));
  }
  payload.attachments?.forEach((file, index) => {
    form.append(`attachment_${index}`, file);
  });

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: "POST",
    body: form,
  });

  if (!response.ok || !response.body) {
    const message = await buildErrorMessage(response);
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let completed = false;

  const flushBuffer = () => {
    const events: AgentStreamEvent[] = [];
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (!rawEvent.trim()) continue;
      const lines = rawEvent.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") {
          continue;
        }
        try {
          const parsed = JSON.parse(data) as { type?: AgentStreamEventType; delta?: string } & AgentStreamEvent;
          if (parsed.type) {
            events.push(parsed);
          }
        } catch (error) {
          console.warn("解析 Agent 流事件失败:", error);
        }
      }
    }
    return events;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const events = flushBuffer();
      for (const event of events) {
        if (event.type === "thinking" && event.delta && callbacks.onThinkingDelta) {
          callbacks.onThinkingDelta(event.delta);
        } else if (event.type === "content" && event.delta && callbacks.onContentDelta) {
          callbacks.onContentDelta(event.delta);
        } else if (event.type === "action_plan" && callbacks.onActionPlan) {
          callbacks.onActionPlan(event.prompts ?? [], event.thinking, event.action, event.size);
        } else if (event.type === "error" && callbacks.onError && event.message) {
          callbacks.onError(new Error(event.message));
          completed = true;
        } else if (event.type === "complete") {
          callbacks.onComplete(event);
          completed = true;
        }
      }
      if (completed) {
        break;
      }
    }
    if (!completed) {
      // Flush the remaining buffer (in case stream ended without delimiter)
      buffer += decoder.decode(new Uint8Array(), { stream: false });
      const events = flushBuffer();
      for (const event of events) {
        if (event.type === "thinking" && event.delta && callbacks.onThinkingDelta) {
          callbacks.onThinkingDelta(event.delta);
        } else if (event.type === "content" && event.delta && callbacks.onContentDelta) {
          callbacks.onContentDelta(event.delta);
        } else if (event.type === "action_plan" && callbacks.onActionPlan) {
          callbacks.onActionPlan(event.prompts ?? [], event.thinking, event.action, event.size);
        } else if (event.type === "error" && callbacks.onError && event.message) {
          callbacks.onError(new Error(event.message));
          completed = true;
        } else if (event.type === "complete") {
          callbacks.onComplete(event);
          completed = true;
        }
      }
    }
  } catch (error) {
    if (callbacks.onError && error instanceof Error) {
      callbacks.onError(error);
      return;
    }
    throw error;
  }
};

export const finalizeAgentSession = async (sessionId: string): Promise<FinalizeSessionResponse> => {
  if (useMockAgent) {
    return mockFinalizeAgentSession(sessionId);
  }

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/finalize`, {
    method: "POST",
    headers: jsonHeaders
  });
  return checkResponse<FinalizeSessionResponse>(response);
};

export const fetchKnowledgeBase = async (): Promise<KnowledgeEntry[]> => {
  if (useMockAgent) {
    return mockFetchKnowledgeBase();
  }

  const response = await fetch(`${API_BASE}/knowledge`, {
    method: "GET",
    headers: jsonHeaders
  });
  return checkResponse<KnowledgeEntry[]>(response);
};
