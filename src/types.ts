import type { Locale } from "./i18n";

export type PresetCategory = "style" | "material";

export interface PresetTranslations {
  name?: Partial<Record<Locale, string>>;
  prompt?: Partial<Record<Locale, string>>;
}

export interface Preset {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
  category: PresetCategory;
  isSystem?: boolean;
  translations?: PresetTranslations;
}

export interface GenerationTask {
  id: string;
  prompt: string;
  createdAt: string;
  status: "success" | "error" | "pending";
  results: GeneratedArtwork[];
  requestedCount?: number;
  origin?: string;
  sourceArtworkId?: string;
}

export interface GeneratedArtwork {
  id: string;
  imageUrl: string;
  seed?: string;
  sizeLabel?: string;
  prompt?: string;
  error?: string;
  index?: number;
}

export type AppPage = "prompt" | "agent" | "final";

export type AgentRole = "user" | "assistant" | "system";

export interface AgentAttachment {
  type: "image" | "file";
  url: string;
  description?: string;
  name?: string;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
  attachments?: AgentAttachment[];
  planStepId?: string;
  thinkingTrace?: string;
  action?: string;
  prompts?: string[];
  requestedCount?: number;
}

export type AgentPlanStatus = "pending" | "active" | "completed";

export interface AgentPlanStep {
  id: string;
  title: string;
  detail?: string;
  status: AgentPlanStatus;
}

export interface AgentSessionSummary {
  id: string;
  initialPrompt: string;
  createdAt: string;
  status: "collecting" | "in_progress" | "finalized";
  referenceImageUrl?: string;
  notes?: string;
  requestedCount?: number;
}

export interface AgentSessionDetail extends AgentSessionSummary {
  plan: AgentPlanStep[];
  messages: AgentMessage[];
  knowledgeReferences?: string[];
  finalPrompt?: string;
  generatedArtworks?: GeneratedArtwork[];
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  relatedPrompts: string[];
}

export interface CreateSessionRequest {
  prompt: string;
  referenceImage?: File | null;
  notes?: string;
  locale?: string;
  requestedCount?: number;
}

export interface SendAgentMessageRequest {
  message: string;
  attachments?: File[];
  requestedCount?: number;
}

export interface FinalizeSessionResponse {
  session: AgentSessionDetail;
  finalPrompt: string;
  generatedArtworks: GeneratedArtwork[];
}
