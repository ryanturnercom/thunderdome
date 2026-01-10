"use client";

import { useState, useCallback, useRef } from "react";
import { useArena } from "@/contexts/arena-context";
import { PromptComposer } from "./prompt-composer";
import { ModelSelectorGrid } from "./model-selector";
import { ResponseGrid } from "./response-grid";
import { EvaluatorPanel } from "./evaluator-panel";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { StreamChunk } from "@/types/models";

interface ModelResponse {
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

export function Arena() {
  const {
    prompts,
    setSystemPrompt,
    setUserPrompt,
    clearPrompts,
    isValid,
    selectedModels,
    selectModel,
    clearModel,
    getModelForSlot,
    hasModels,
    isExecuting,
    setIsExecuting,
  } = useArena();

  const [responses, setResponses] = useState<Map<string, ModelResponse>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const canExecute = isValid && hasModels && !isExecuting;
  const hasResponses = responses.size > 0;
  const allComplete = Array.from(responses.values()).every(
    (r) => r.isComplete || r.isError
  );

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: prompts.systemPrompt,
          userPrompt: prompts.userPrompt,
          models: selectedModels,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));
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
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

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
  }, [prompts, selectedModels, setIsExecuting]);

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
    setResponses(new Map());
  };

  const handleClearAll = () => {
    clearPrompts();
    handleReset();
  };

  const getModelIdForSlot = (slot: 1 | 2 | 3): string | null => {
    const model = getModelForSlot(slot);
    return model?.id || null;
  };

  const getResponseForModel = (modelId: string): ModelResponse | null => {
    return responses.get(modelId) || null;
  };

  return (
    <div className="space-y-6">
      <PromptComposer
        prompts={prompts}
        onSystemPromptChange={setSystemPrompt}
        onUserPromptChange={setUserPrompt}
      />

      <ModelSelectorGrid
        getModelIdForSlot={getModelIdForSlot}
        onSelectModel={selectModel}
        onClearModel={clearModel}
      />

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={handleClearAll}
          disabled={isExecuting}
        >
          Clear All
        </Button>
        {hasResponses && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isExecuting}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Responses
          </Button>
        )}
        <Button
          className="px-8 thunderdome-button"
          disabled={!canExecute}
          onClick={execute}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              EXECUTING...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              EXECUTE
            </>
          )}
        </Button>
      </div>

      {hasResponses && (
        <>
          <ResponseGrid
            selectedModels={selectedModels}
            getResponseForModel={getResponseForModel}
          />

          <EvaluatorPanel
            responses={responses}
            systemPrompt={prompts.systemPrompt}
            userPrompt={prompts.userPrompt}
            allComplete={allComplete}
          />
        </>
      )}
    </div>
  );
}
