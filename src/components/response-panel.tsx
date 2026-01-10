"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS, Provider } from "@/types/models";
import { ModelResponse } from "@/hooks/use-execution";
import { Loader2 } from "lucide-react";

interface ResponsePanelProps {
  modelId: string;
  response: ModelResponse | null;
  slot: 1 | 2 | 3;
}

const providerColors: Record<Provider, string> = {
  openai: "bg-green-600",
  anthropic: "bg-orange-600",
  google: "bg-blue-600",
};

const providerLabels: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

export function ResponsePanel({ modelId, response, slot }: ResponsePanelProps) {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);

  if (!model) {
    return (
      <Card className="thunderdome-panel h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm thunderdome-header">
            SLOT {slot} - No Model Selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a model to see responses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="thunderdome-panel h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm thunderdome-header flex items-center justify-between">
          <span className="flex items-center gap-2">
            SLOT {slot}: {model.name}
            {response?.isStreaming && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </span>
          <Badge className={providerColors[model.provider]}>
            {providerLabels[model.provider]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {!response ? (
          <p className="text-muted-foreground text-sm">
            Waiting for execution...
          </p>
        ) : response.isError ? (
          <div className="text-destructive text-sm">
            <p className="font-semibold">Error:</p>
            <p>{response.error}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-3 rounded-md min-h-[200px]">
                {response.content || (
                  <span className="text-muted-foreground">
                    Waiting for response...
                  </span>
                )}
              </pre>
            </div>
            {response.isComplete && response.usage && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    Tokens: {response.usage.totalTokens.toLocaleString()} (
                    {response.usage.promptTokens.toLocaleString()} in /{" "}
                    {response.usage.completionTokens.toLocaleString()} out)
                  </span>
                  {response.latencyMs && (
                    <span>Latency: {(response.latencyMs / 1000).toFixed(2)}s</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
