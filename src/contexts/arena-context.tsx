"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { SelectedModel, AVAILABLE_MODELS } from "@/types/models";
import { SavedResponse } from "@/types/config";

interface Prompts {
  systemPrompt: string;
  userPrompt: string;
}

export interface ModelResponse {
  modelId: string;
  content: string;
  isStreaming: boolean;
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

interface ArenaContextType {
  // Prompts
  prompts: Prompts;
  setSystemPrompt: (value: string) => void;
  setUserPrompt: (value: string) => void;
  clearPrompts: () => void;
  isValid: boolean;

  // Models
  selectedModels: SelectedModel[];
  selectModel: (slot: 1 | 2 | 3, modelId: string) => void;
  clearModel: (slot: 1 | 2 | 3) => void;
  loadModels: (models: SelectedModel[]) => void;
  getModelForSlot: (slot: 1 | 2 | 3) => typeof AVAILABLE_MODELS[number] | null;
  hasModels: boolean;

  // Execution state (for disabling buttons)
  isExecuting: boolean;
  setIsExecuting: (value: boolean) => void;

  // Responses
  responses: Map<string, ModelResponse>;
  setResponses: (responses: Map<string, ModelResponse> | ((prev: Map<string, ModelResponse>) => Map<string, ModelResponse>)) => void;
  updateResponse: (modelId: string, update: Partial<ModelResponse>) => void;
  clearResponses: () => void;
  loadResponses: (savedResponses: SavedResponse[]) => void;
  hasResponses: boolean;
  allComplete: boolean;

  // Evaluation
  evaluation: string | null;
  setEvaluation: (evaluation: string | null) => void;
}

const ArenaContext = createContext<ArenaContextType | null>(null);

export function ArenaProvider({ children }: { children: ReactNode }) {
  // Prompts state
  const [prompts, setPrompts] = useState<Prompts>({
    systemPrompt: "",
    userPrompt: "",
  });

  const setSystemPrompt = useCallback((value: string) => {
    setPrompts((prev) => ({ ...prev, systemPrompt: value }));
  }, []);

  const setUserPrompt = useCallback((value: string) => {
    setPrompts((prev) => ({ ...prev, userPrompt: value }));
  }, []);

  const clearPrompts = useCallback(() => {
    setPrompts({ systemPrompt: "", userPrompt: "" });
  }, []);

  const isValid = prompts.userPrompt.trim().length > 0;

  // Models state
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);

  const selectModel = useCallback((slot: 1 | 2 | 3, modelId: string) => {
    setSelectedModels((prev) => {
      const filtered = prev.filter((m) => m.slot !== slot);
      if (modelId) {
        return [...filtered, { slot, modelId }].sort((a, b) => a.slot - b.slot);
      }
      return filtered;
    });
  }, []);

  const clearModel = useCallback((slot: 1 | 2 | 3) => {
    setSelectedModels((prev) => prev.filter((m) => m.slot !== slot));
  }, []);

  const loadModels = useCallback((models: SelectedModel[]) => {
    setSelectedModels(models.sort((a, b) => a.slot - b.slot));
  }, []);

  const getModelForSlot = useCallback(
    (slot: 1 | 2 | 3) => {
      const selected = selectedModels.find((m) => m.slot === slot);
      if (!selected) return null;
      return AVAILABLE_MODELS.find((m) => m.id === selected.modelId) || null;
    },
    [selectedModels]
  );

  const hasModels = selectedModels.length > 0;

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);

  // Responses state
  const [responses, setResponsesState] = useState<Map<string, ModelResponse>>(
    new Map()
  );

  const setResponses = useCallback((newResponses: Map<string, ModelResponse> | ((prev: Map<string, ModelResponse>) => Map<string, ModelResponse>)) => {
    if (typeof newResponses === "function") {
      setResponsesState(newResponses);
    } else {
      setResponsesState(newResponses);
    }
  }, []);

  const updateResponse = useCallback((modelId: string, update: Partial<ModelResponse>) => {
    setResponsesState((prev) => {
      const newResponses = new Map(prev);
      const existing = newResponses.get(modelId);
      if (existing) {
        newResponses.set(modelId, { ...existing, ...update });
      }
      return newResponses;
    });
  }, []);

  const clearResponses = useCallback(() => {
    setResponsesState(new Map());
  }, []);

  const loadResponses = useCallback((savedResponses: SavedResponse[]) => {
    const newResponses = new Map<string, ModelResponse>();
    for (const saved of savedResponses) {
      newResponses.set(saved.modelId, {
        modelId: saved.modelId,
        content: saved.content,
        isStreaming: false,
        isComplete: saved.isComplete,
        isError: saved.isError,
        error: saved.error,
        usage: saved.usage,
        latencyMs: saved.latencyMs,
      });
    }
    if (typeof newResponses === "function") {
      setResponsesState(newResponses);
    } else {
      setResponsesState(newResponses);
    }
  }, []);

  const hasResponses = responses.size > 0;
  const allComplete = Array.from(responses.values()).every(
    (r) => r.isComplete || r.isError
  );

  // Evaluation state
  const [evaluation, setEvaluation] = useState<string | null>(null);

  return (
    <ArenaContext.Provider
      value={{
        prompts,
        setSystemPrompt,
        setUserPrompt,
        clearPrompts,
        isValid,
        selectedModels,
        selectModel,
        clearModel,
        loadModels,
        getModelForSlot,
        hasModels,
        isExecuting,
        setIsExecuting,
        responses,
        setResponses,
        updateResponse,
        clearResponses,
        loadResponses,
        hasResponses,
        allComplete,
        evaluation,
        setEvaluation,
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
}

export function useArena() {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error("useArena must be used within an ArenaProvider");
  }
  return context;
}
