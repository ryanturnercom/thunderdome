export type Provider = "openai" | "anthropic" | "google";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: Provider;
  contextWindow: number;
  description: string;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // OpenAI Models (2025-2026)
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    contextWindow: 400000,
    description: "Latest flagship - coding & agentic tasks",
  },
  {
    id: "gpt-5-2025-08-07",
    name: "GPT-5",
    provider: "openai",
    contextWindow: 200000,
    description: "GPT-5 base model",
  },
  {
    id: "gpt-5-mini-2025-08-07",
    name: "GPT-5 Mini",
    provider: "openai",
    contextWindow: 200000,
    description: "Smaller, faster GPT-5 variant",
  },
  {
    id: "gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    provider: "openai",
    contextWindow: 1000000,
    description: "1M context window, great for long docs",
  },
  {
    id: "o4-mini-2025-04-16",
    name: "o4-mini",
    provider: "openai",
    contextWindow: 200000,
    description: "Fast reasoning model - math, coding, visual",
  },
  {
    id: "o3-2025-04-16",
    name: "o3",
    provider: "openai",
    contextWindow: 200000,
    description: "Advanced reasoning model",
  },
  // Anthropic Models (2025-2026)
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Latest flagship - best for coding & agents",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    contextWindow: 1000000,
    description: "Fast & capable - 1M context with beta header",
  },
  {
    id: "claude-haiku-4-5-20251015",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Small & fast - 2x speed at 1/3 cost of Sonnet",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Previous gen Sonnet - still excellent",
  },
  // Google Models (2025-2026)
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
    contextWindow: 1000000,
    description: "Latest reasoning model - agentic & coding",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Pro intelligence at Flash speed & price",
  },
  {
    id: "gemini-2.5-pro-preview-06-05",
    name: "Gemini 2.5 Pro",
    provider: "google",
    contextWindow: 1000000,
    description: "Previous gen Pro - stable & reliable",
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Fast & efficient for quick tasks",
  },
];

export interface SelectedModel {
  slot: 1 | 2 | 3;
  modelId: string;
}

export interface ExecutionRequest {
  systemPrompt: string;
  userPrompt: string;
  models: SelectedModel[];
}

export interface ExecutionResponse {
  modelId: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  error?: string;
}

export interface StreamChunk {
  modelId: string;
  type: "content" | "done" | "error";
  content?: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
  error?: string;
}
