"use client";

import { usePrompts } from "@/hooks/use-prompts";
import { PromptComposer } from "./prompt-composer";
import { Button } from "@/components/ui/button";

export function Arena() {
  const {
    prompts,
    setSystemPrompt,
    setUserPrompt,
    clearPrompts,
    isValid,
  } = usePrompts();

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

      <PromptComposer
        prompts={prompts}
        onSystemPromptChange={setSystemPrompt}
        onUserPromptChange={setUserPrompt}
      />

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={clearPrompts}
          disabled={!prompts.systemPrompt && !prompts.userPrompt}
        >
          Clear All
        </Button>
        <Button
          className="px-8"
          disabled={!isValid}
        >
          EXECUTE
        </Button>
      </div>

      {/* Model Selector will be added in Epic 4 */}
      {/* Response Grid will be added in Epic 5 */}
    </div>
  );
}
