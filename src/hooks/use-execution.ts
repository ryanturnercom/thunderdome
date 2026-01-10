"use client";

import { useState, useCallback, useRef } from "react";
import { SelectedModel, StreamChunk } from "@/types/models";

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

export function useExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [responses, setResponses] = useState<Map<string, ModelResponse>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      systemPrompt: string,
      userPrompt: string,
      selectedModels: SelectedModel[]
    ) => {
      // Abort any existing execution
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Initialize state
      setIsExecuting(true);
      const initialResponses = new Map<string, ModelResponse>();
      for (const model of selectedModels) {
        initialResponses.set(model.modelId, {
          modelId: model.modelId,
          content: "",
          isStreaming: true,
          isComplete: false,
          isError: false,
        });
      }
      setResponses(initialResponses);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            models: selectedModels,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              try {
                const chunk: StreamChunk = JSON.parse(jsonStr);

                setResponses((prev) => {
                  const newResponses = new Map(prev);
                  const existing = newResponses.get(chunk.modelId);

                  if (chunk.type === "content" && chunk.content) {
                    newResponses.set(chunk.modelId, {
                      ...existing!,
                      content: (existing?.content || "") + chunk.content,
                    });
                  } else if (chunk.type === "done") {
                    newResponses.set(chunk.modelId, {
                      ...existing!,
                      isStreaming: false,
                      isComplete: true,
                      usage: chunk.usage,
                      latencyMs: chunk.latencyMs,
                    });
                  } else if (chunk.type === "error") {
                    newResponses.set(chunk.modelId, {
                      ...existing!,
                      isStreaming: false,
                      isError: true,
                      error: chunk.error,
                      latencyMs: chunk.latencyMs,
                    });
                  }

                  return newResponses;
                });
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Execution was cancelled
          return;
        }

        // Mark all streaming models as errored
        setResponses((prev) => {
          const newResponses = new Map(prev);
          for (const [modelId, response] of newResponses) {
            if (response.isStreaming) {
              newResponses.set(modelId, {
                ...response,
                isStreaming: false,
                isError: true,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }
          return newResponses;
        });
      } finally {
        setIsExecuting(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setResponses(new Map());
  }, [cancel]);

  const getResponseForModel = useCallback(
    (modelId: string): ModelResponse | null => {
      return responses.get(modelId) || null;
    },
    [responses]
  );

  const allComplete = Array.from(responses.values()).every(
    (r) => r.isComplete || r.isError
  );

  const hasResponses = responses.size > 0;

  return {
    isExecuting,
    responses,
    execute,
    cancel,
    reset,
    getResponseForModel,
    allComplete,
    hasResponses,
  };
}
