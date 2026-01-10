"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsePanel } from "@/components/response-panel";
import { SelectedModel } from "@/types/models";
import { ModelResponse } from "@/hooks/use-execution";

interface ResponseGridProps {
  selectedModels: SelectedModel[];
  getResponseForModel: (modelId: string) => ModelResponse | null;
}

export function ResponseGrid({
  selectedModels,
  getResponseForModel,
}: ResponseGridProps) {
  // Create a map of slot to modelId for easy lookup
  const modelBySlot = new Map<1 | 2 | 3, string>();
  for (const model of selectedModels) {
    modelBySlot.set(model.slot, model.modelId);
  }

  // Always show 3 slots
  const slots: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <Card className="thunderdome-panel">
      <CardHeader>
        <CardTitle className="thunderdome-header">RESPONSES</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const modelId = modelBySlot.get(slot);
            return (
              <ResponsePanel
                key={slot}
                slot={slot}
                modelId={modelId || ""}
                response={modelId ? getResponseForModel(modelId) : null}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
