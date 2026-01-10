"use client";

import { useState, useCallback } from "react";
import { SelectedModel, AVAILABLE_MODELS } from "@/types/models";

export function useModelSelection() {
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

  const clearAllModels = useCallback(() => {
    setSelectedModels([]);
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

  return {
    selectedModels,
    selectModel,
    clearModel,
    clearAllModels,
    getModelForSlot,
    hasModels,
  };
}
