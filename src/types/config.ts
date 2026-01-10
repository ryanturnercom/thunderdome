import { SelectedModel } from "./models";

export interface ThunderdomeConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  userPrompt: string;
  models: SelectedModel[];
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
}

export interface UpdateConfigRequest extends SaveConfigRequest {
  id: string;
}
