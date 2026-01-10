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
    description: "Most capable OpenAI model, great for complex tasks",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    description: "Fast and cost-effective for simpler tasks",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    contextWindow: 128000,
    description: "Previous generation high-capability model",
  },
  // Anthropic Models
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Latest Claude model, excellent reasoning",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Fast and capable for most tasks",
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    description: "Fastest Claude model, good for quick tasks",
  },
  // Google Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Latest Gemini, fast with large context",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    contextWindow: 2000000,
    description: "Massive context window for long documents",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    contextWindow: 1000000,
    description: "Fast and efficient for quick tasks",
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
