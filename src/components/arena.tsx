"use client";

import { usePrompts } from "@/hooks/use-prompts";
import { useModelSelection } from "@/hooks/use-model-selection";
import { useExecution } from "@/hooks/use-execution";
import { PromptComposer } from "./prompt-composer";
import { ModelSelectorGrid } from "./model-selector";
import { ResponseGrid } from "./response-grid";
import { EvaluatorPanel } from "./evaluator-panel";
import { SaveConfigDialog } from "./save-config-dialog";
import { LoadConfigDialog } from "./load-config-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { SelectedModel } from "@/types/models";

export function Arena() {
  const {
    prompts,
    setSystemPrompt,
    setUserPrompt,
    clearPrompts,
    isValid,
  } = usePrompts();

  const {
    selectedModels,
    selectModel,
    clearModel,
    loadModels,
    getModelForSlot,
    hasModels,
  } = useModelSelection();

  const {
    isExecuting,
    responses,
    execute,
    reset,
    getResponseForModel,
    allComplete,
    hasResponses,
  } = useExecution();

  const canExecute = isValid && hasModels && !isExecuting;

  const handleExecute = () => {
    execute(prompts.systemPrompt, prompts.userPrompt, selectedModels);
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    clearPrompts();
    reset();
  };

  const handleLoadConfig = (config: {
    systemPrompt: string;
    userPrompt: string;
    models: SelectedModel[];
  }) => {
    setSystemPrompt(config.systemPrompt);
    setUserPrompt(config.userPrompt);
    loadModels(config.models);
    reset(); // Clear any previous responses
  };

  // Helper to get modelId for a slot
  const getModelIdForSlot = (slot: 1 | 2 | 3): string | null => {
    const model = getModelForSlot(slot);
    return model?.id || null;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold thunderdome-header mb-2">
          ENTER THE ARENA
        </h1>
        <p className="text-muted-foreground">
          Test your prompts against multiple LLMs in parallel
        </p>
      </div>

      {/* Config management buttons */}
      <div className="flex justify-center gap-4">
        <LoadConfigDialog onLoad={handleLoadConfig} disabled={isExecuting} />
        <SaveConfigDialog
          systemPrompt={prompts.systemPrompt}
          userPrompt={prompts.userPrompt}
          models={selectedModels}
          disabled={!isValid || isExecuting}
        />
      </div>

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
          onClick={handleExecute}
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
