"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { ModelResponse } from "@/hooks/use-execution";

interface EvaluatorPanelProps {
  responses: Map<string, ModelResponse>;
  systemPrompt: string;
  userPrompt: string;
  allComplete: boolean;
}

export function EvaluatorPanel({
  responses,
  systemPrompt,
  userPrompt,
  allComplete,
}: EvaluatorPanelProps) {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get successful responses only
  const successfulResponses = Array.from(responses.entries())
    .filter(([, r]) => r.isComplete && !r.isError && r.content)
    .map(([modelId, r]) => ({ modelId, content: r.content }));

  const canEvaluate =
    allComplete && successfulResponses.length >= 2 && !isEvaluating;

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setError(null);
    setEvaluation(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalPrompt: userPrompt,
          systemPrompt,
          responses: successfulResponses,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Evaluation failed");
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <Card className="thunderdome-panel">
      <CardHeader>
        <CardTitle className="thunderdome-header flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            GEMINI EVALUATOR
          </span>
          <Button
            onClick={handleEvaluate}
            disabled={!canEvaluate}
            size="sm"
            className="thunderdome-button"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              "Run Evaluation"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!allComplete && responses.size > 0 ? (
          <p className="text-muted-foreground text-sm">
            Waiting for all models to complete...
          </p>
        ) : successfulResponses.length < 2 ? (
          <p className="text-muted-foreground text-sm">
            Need at least 2 successful responses to run evaluation.
          </p>
        ) : error ? (
          <div className="text-destructive text-sm">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        ) : evaluation ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-md">
              {evaluation}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Click &quot;Run Evaluation&quot; to compare responses using Gemini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
