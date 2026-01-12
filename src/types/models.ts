export type Provider = "openai" | "anthropic" | "google";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: Provider;
  contextWindow: number;
  maxOutputTokens: number | null; // null = don't send parameter (model handles it)
  description: string;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // OpenAI GPT-5 Series (Latest flagship models)
  // GPT-5.x models don't support max_tokens parameter
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    contextWindow: 256000,
    maxOutputTokens: null,
    description: "Newest flagship model, strongest performance",
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    contextWindow: 256000,
    maxOutputTokens: null,
    description: "Advanced reasoning and agentic workflows",
  },
  // OpenAI GPT-4.1 Family
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 32768,
    description: "Premium non-reasoning large model",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    description: "Faster and cheaper",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    description: "Most cost-efficient small variant",
  },
  // OpenAI GPT-4o Series (Multimodal)
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    description: "General multimodal model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    description: "Smaller and faster multimodal",
  },
  // OpenAI Reasoning Models (don't support max_tokens)
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    contextWindow: 200000,
    maxOutputTokens: null,
    description: "Advanced reasoning model",
  },
  {
    id: "o3-mini",
    name: "o3 Mini",
    provider: "openai",
    contextWindow: 200000,
    maxOutputTokens: null,
    description: "Fast reasoning model",
  },
  // Anthropic Claude 4.5 Family (Latest)
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "Premium max intelligence + practical performance",
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "Best for agents and coding",
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "Near-instant responses + extended thinking",
  },
  // Anthropic Claude 4 Family
  {
    id: "claude-opus-4-1-20250805",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "Most capable model (updated)",
  },
  {
    id: "claude-opus-4-0",
    name: "Claude Opus 4",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "Most capable model",
  },
  {
    id: "claude-sonnet-4-0",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 16384,
    description: "High-performance with extended thinking",
  },
  // Anthropic Claude 3.7
  {
    id: "claude-3-7-sonnet-latest",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: "High-performance with early extended thinking",
  },
  // Anthropic Claude 3.5
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: "Fastest and most compact",
  },
  // Anthropic Claude 3 (Legacy) - 4096 max output
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    description: "Previous fast and cost-effective option",
  },
  // Google Gemini 3 (Preview)
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Latest Pro preview",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Latest Flash preview",
  },
  // Google Gemini 2.5 Pro
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Most capable stable model",
  },
  // Google Gemini 2.5 Flash
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Fast and efficient",
  },
  {
    id: "gemini-2.5-flash-preview-09-2025",
    name: "Gemini 2.5 Flash Preview",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Flash preview build",
  },
  // Google Gemini 2.5 Flash-Lite
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Lightweight and cost-effective",
  },
  {
    id: "gemini-2.5-flash-lite-preview-09-2025",
    name: "Gemini 2.5 Flash Lite Preview",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    description: "Lite preview build",
  },
  // Google Gemini 2.0 (Previous Gen)
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Previous gen Flash",
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash 001",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Flash stable release",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash Exp",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Flash experimental",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Lightweight previous gen",
  },
  {
    id: "gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash Lite 001",
    provider: "google",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Lite stable release",
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
