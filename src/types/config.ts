import { SelectedModel } from "./models";

export interface SavedResponse {
  modelId: string;
  content: string;
  isComplete: boolean;
  isError: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
}

export interface ThunderdomeConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  userPrompt: string;
  models: SelectedModel[];
  responses?: SavedResponse[];
  evaluation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigListItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveConfigRequest {
  name: string;
  description?: string;
  systemPrompt: string;
  userPrompt: string;
  models: SelectedModel[];
  responses?: SavedResponse[];
  evaluation?: string;
}

export interface UpdateConfigRequest extends SaveConfigRequest {
  id: string;
}
