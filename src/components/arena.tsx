"use client";

import { useCallback, useRef } from "react";
import { useArena, ModelResponse } from "@/contexts/arena-context";
import { useAuth } from "@/contexts/auth-context";
import { PromptComposer } from "./prompt-composer";
import { ModelSelectorGrid } from "./model-selector";
import { ResponseGrid } from "./response-grid";
import { EvaluatorPanel } from "./evaluator-panel";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { StreamChunk } from "@/types/models";

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
    responses,
    setResponses,
    clearResponses,
    hasResponses,
    allComplete,
    setEvaluation,
  } = useArena();

  const abortControllerRef = useRef<AbortController | null>(null);
  const { isGuest, guestExecutionsRemaining, guestExecutionLimit, guestLimitReached, refreshGuestStatus } = useAuth();

  const canExecute = isValid && hasModels && !isExecuting && !guestLimitReached;

  const execute = useCallback(async () => {
    // Play sound on execute
    const audio = new Audio("/welcome.wav");
    audio.play().catch(() => {});
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsExecuting(true);
    setEvaluation(null); // Clear previous evaluation
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

      if (!response.ok) {
        // Handle 429 (guest limit reached) specially
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.isGuestLimitError) {
            // Refresh guest status to update UI
            await refreshGuestStatus();
            throw new Error(errorData.message || "Guest execution limit reached. Please log in to continue.");
          }
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
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
      // Refresh guest status to update remaining executions count
      if (isGuest) {
        refreshGuestStatus();
      }
    }
  }, [prompts, selectedModels, setIsExecuting, setResponses, setEvaluation, isGuest, refreshGuestStatus]);

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
    clearResponses();
    setEvaluation(null);
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

      {/* Guest execution limit feedback */}
      {isGuest && (
        <div className="flex justify-center">
          {guestLimitReached ? (
            <div className="text-center">
              <p className="text-destructive font-medium">
                Daily guest limit reached. Please log in to continue or try again tomorrow.
              </p>
              <a
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Go to login
              </a>
            </div>
          ) : guestExecutionsRemaining !== null && guestExecutionLimit !== null && (
            <p className={`text-sm ${guestExecutionsRemaining <= 2 ? "text-yellow-500" : "text-muted-foreground"}`}>
              {guestExecutionsRemaining} of {guestExecutionLimit} daily executions remaining
            </p>
          )}
        </div>
      )}

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
