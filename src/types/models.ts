export type Provider = "openai" | "anthropic" | "google";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: Provider;
  contextWindow: number;
  description: string;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    description: "Most capable OpenAI model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    description: "Fast and cost-effective",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    contextWindow: 128000,
    description: "Previous generation high-capability",
  },
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    contextWindow: 200000,
    description: "Advanced reasoning model",
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    provider: "openai",
    contextWindow: 128000,
    description: "Fast reasoning model",
  },
  // Anthropic Models (from official docs)
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Best balance of intelligence & speed",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Fastest model, near-frontier intelligence",
  },
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Maximum intelligence premium model",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Previous gen Sonnet - still excellent",
  },
  // Google Gemini Models (from official docs)
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Fast & efficient (stable)",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    contextWindow: 1000000,
    description: "Most capable Gemini (stable)",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Previous gen Flash",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    contextWindow: 2000000,
    description: "2M context window",
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
