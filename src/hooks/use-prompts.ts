"use client";

import { useState, useCallback } from "react";

export interface PromptState {
  systemPrompt: string;
  userPrompt: string;
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptState>({
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

  const loadPrompts = useCallback((newPrompts: PromptState) => {
    setPrompts(newPrompts);
  }, []);

  const isValid = prompts.userPrompt.trim().length > 0;

  return {
    prompts,
    setSystemPrompt,
    setUserPrompt,
    clearPrompts,
    loadPrompts,
    isValid,
  };
}
