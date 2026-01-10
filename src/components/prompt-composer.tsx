"use client";

import { PromptInput } from "./prompt-input";
import { PromptState } from "@/hooks/use-prompts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PromptComposerProps {
  prompts: PromptState;
  onSystemPromptChange: (value: string) => void;
  onUserPromptChange: (value: string) => void;
}

export function PromptComposer({
  prompts,
  onSystemPromptChange,
  onUserPromptChange,
}: PromptComposerProps) {
  return (
    <Card className="thunderdome-panel">
      <CardHeader>
        <CardTitle className="thunderdome-header">PROMPT COMPOSER</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PromptInput
          label="SYSTEM PROMPT"
          value={prompts.systemPrompt}
          onChange={onSystemPromptChange}
          placeholder="Enter your system prompt here... (e.g., You are a helpful assistant that...)"
        />
        <PromptInput
          label="USER PROMPT"
          value={prompts.userPrompt}
          onChange={onUserPromptChange}
          placeholder="Enter your user prompt here... (e.g., Explain quantum computing in simple terms)"
        />
      </CardContent>
    </Card>
  );
}
