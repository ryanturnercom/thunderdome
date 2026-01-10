"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { SelectedModel, AVAILABLE_MODELS } from "@/types/models";

interface Prompts {
  systemPrompt: string;
  userPrompt: string;
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
