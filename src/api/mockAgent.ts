import type {
  AgentPlanStep,
  AgentSessionDetail,
  AgentSessionSummary,
  AgentMessage,
  CreateSessionRequest,
  SendAgentMessageRequest,
  GeneratedArtwork,
  KnowledgeEntry,
  FinalizeSessionResponse
} from "../types";

const PLACEHOLDER_IMAGES = [
  "https://dummyimage.com/640x800/0f172a/ffffff&text=Toy+A",
  "https://dummyimage.com/640x800/1e293b/ffffff&text=Toy+B",
  "https://dummyimage.com/640x800/111827/ffffff&text=Toy+C",
  "https://dummyimage.com/640x800/0b1120/ffffff&text=Toy+D"
];

const MOCK_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "astro-bear",
    title: "太空熊系列",
    summary: "背着喷气背包的太空熊角色，透明外壳与发光内芯营造漂浮感，强调复古太空质感。",
    tags: ["科幻", "透明材质", "发光", "动物角色"],
    relatedPrompts: [
      "retro space explorer bear with transparent resin body",
      "internal galaxy nebula illumination",
      "chrome jetpack with neon edges"
    ]
  },
  {
    id: "neo-chinatown",
    title: "霓虹唐潮街区",
    summary: "融合赛博朋克霓虹与中国传统街景，突出霓虹牌匾、龙纹灯笼与金属玻璃材质对比。",
    tags: ["国潮", "赛博朋克", "夜景", "街区场景"],
    relatedPrompts: [
      "cyberpunk chinatown street with holographic signboards",
      "dragon lanterns casting neon reflections",
      "wet pavement with reflective glass and brushed metal"
    ]
  },
  {
    id: "organic-mech",
    title: "生物机甲融合体",
    summary: "结合机甲结构与自然元素的潮玩设定，骨骼装甲、植物蔓延与可动关节并存。",
    tags: ["机甲", "自然", "收藏级", "可动结构"],
    relatedPrompts: [
      "biomechanical armor with ivy wrapped joints",
      "matte ceramic plates with organic veins",
      "articulated limbs highlighted by resin gloss"
    ]
  }
];

const mockSessions = new Map<string, AgentSessionDetail>();

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const clone = <T>(value: T): T => (typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

const buildInitialPlan = (sessionId: string): AgentPlanStep[] => [
  {
    id: `${sessionId}-plan-1`,
    title: "理解需求",
    detail: "解析初始提示词，确认核心角色设定与情绪氛围。",
    status: "active"
  },
  {
    id: `${sessionId}-plan-2`,
    title: "补充分镜",
    detail: "与用户协作补充材质、配色、工艺和故事细节。",
    status: "pending"
  },
  {
    id: `${sessionId}-plan-3`,
    title: "生成效果图",
    detail: "整理 prompt，调用模型输出草图与高清渲染。",
    status: "pending"
  }
];

const buildAssistantGreeting = (prompt: string, knowledgeId?: string): AgentMessage => ({
  id: randomId("msg"),
  role: "assistant",
  createdAt: new Date().toISOString(),
  content: `我已经记录了你的想法：“${prompt}”。我会结合潮玩灵感库${knowledgeId ? `（例如 ${knowledgeId}）` : ""}来完善设计，请继续补充材质、配色或故事细节吧！`
});

const getKnowledgeSuggestion = (prompt: string): KnowledgeEntry | undefined =>
  MOCK_KNOWLEDGE.find((entry) => entry.tags.some((tag) => prompt.includes(tag))) || MOCK_KNOWLEDGE[0];

export const mockCreateAgentSession = async (payload: CreateSessionRequest): Promise<AgentSessionSummary> => {
  const id = randomId("session");
  const createdAt = new Date().toISOString();
  const knowledge = getKnowledgeSuggestion(payload.prompt);
  const referenceImageUrl =
    typeof window !== "undefined" && payload.referenceImage ? URL.createObjectURL(payload.referenceImage) : undefined;

  const assistantMessage = buildAssistantGreeting(payload.prompt, knowledge?.title);

  const detail: AgentSessionDetail = {
    id,
    initialPrompt: payload.prompt,
    createdAt,
    status: "collecting",
    referenceImageUrl,
    notes: payload.notes,
    plan: buildInitialPlan(id),
    messages: [
      {
        id: randomId("system"),
        role: "system",
        content: "你是一名潮玩设计顾问，需要帮助用户梳理需求并生成高质量的潮玩 prompt。",
        createdAt
      },
      assistantMessage
    ],
    knowledgeReferences: knowledge ? [knowledge.title] : [],
    generatedArtworks: []
  };

  mockSessions.set(id, detail);

  return {
    id,
    initialPrompt: payload.prompt,
    createdAt,
    status: "collecting",
    referenceImageUrl,
    notes: payload.notes
  };
};

const updatePlanProgress = (plan: AgentPlanStep[]): AgentPlanStep[] => {
  const next = clone(plan);
  const activeIndex = next.findIndex((step) => step.status === "active");
  if (activeIndex >= 0) {
    next[activeIndex] = { ...next[activeIndex], status: "completed" };
    const pendingIndex = next.findIndex((step) => step.status === "pending");
    if (pendingIndex >= 0) {
      next[pendingIndex] = { ...next[pendingIndex], status: "active" };
    }
  }
  return next;
};

const buildArtwork = (sessionId: string, index: number): GeneratedArtwork => ({
  id: `${sessionId}-draft-${index}`,
  imageUrl: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
  seed: `MOCK-${1000 + index}`,
  sizeLabel: "1024x1280"
});

export const mockFetchSessionDetail = async (sessionId: string): Promise<AgentSessionDetail> => {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error("未找到对应的模拟会话");
  }
  return clone(session);
};

export const mockFetchSessionMessages = async (sessionId: string): Promise<AgentMessage[]> => {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error("未找到对应的模拟会话");
  }
  return clone(session.messages);
};

export const mockSendAgentMessage = async (
  sessionId: string,
  payload: SendAgentMessageRequest
): Promise<{ message: AgentMessage; plan: AgentPlanStep[]; artworks: GeneratedArtwork[] }> => {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error("未找到对应的模拟会话");
  }

  const createdAt = new Date().toISOString();
  const userMessage: AgentMessage = {
    id: randomId("msg"),
    role: "user",
    content: payload.message,
    createdAt
  };
  session.messages = [...session.messages, userMessage];

  const relatedKnowledge = getKnowledgeSuggestion(session.initialPrompt);
  const assistantMessage: AgentMessage = {
    id: randomId("msg"),
    role: "assistant",
    createdAt,
    content: `根据你的补充，我建议我们重点突出：${payload.message}。可以结合${relatedKnowledge?.title ?? "灵感库"}的元素，强化材质与色彩表现。`
  };

  let updatedKnowledge = session.knowledgeReferences ?? [];
  if (relatedKnowledge && !updatedKnowledge.includes(relatedKnowledge.title)) {
    updatedKnowledge = [...updatedKnowledge, relatedKnowledge.title];
  }

  const plan = updatePlanProgress(session.plan);
  const artworks = [...session.generatedArtworks];

  if (plan.some((step) => step.status === "active" && step.id.endsWith("plan-3")) && artworks.length < 4) {
    artworks.push(buildArtwork(sessionId, artworks.length));
  }

  session.plan = plan;
  session.knowledgeReferences = updatedKnowledge;
  session.generatedArtworks = artworks;
  session.messages = [...session.messages, assistantMessage];

  mockSessions.set(sessionId, session);

  return {
    message: clone(assistantMessage),
    plan: clone(plan),
    artworks: clone(artworks)
  };
};

export const mockFinalizeAgentSession = async (sessionId: string): Promise<FinalizeSessionResponse> => {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error("未找到对应的模拟会话");
  }

  const knowledge = (session.knowledgeReferences ?? []).join("、") || "潮玩灵感库";
  const conversationSummary = session.messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content)
    .join("；");

  const finalPrompt = [
    session.initialPrompt,
    conversationSummary,
    `参考灵感：${knowledge}`,
    "detailed 3D collectible toy render, studio lighting, 4K, octane render"
  ]
    .filter(Boolean)
    .join("；");

  const artworks = session.generatedArtworks?.length
    ? session.generatedArtworks
    : Array.from({ length: 4 }, (_, index) => buildArtwork(sessionId, index));

  const updatedSession: AgentSessionDetail = {
    ...session,
    status: "finalized",
    plan: session.plan.map((step) => ({ ...step, status: "completed" })),
    generatedArtworks: artworks,
    finalPrompt
  };

  mockSessions.set(sessionId, updatedSession);

  return {
    session: clone(updatedSession),
    finalPrompt,
    generatedArtworks: clone(artworks)
  };
};

export const mockFetchKnowledgeBase = async (): Promise<KnowledgeEntry[]> => clone(MOCK_KNOWLEDGE);
