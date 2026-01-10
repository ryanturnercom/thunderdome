"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS, Provider } from "@/types/models";

interface ModelSelectorProps {
  slot: 1 | 2 | 3;
  selectedModelId: string | null;
  onSelect: (modelId: string) => void;
  onClear: () => void;
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

export function ModelSelector({
  slot,
  selectedModelId,
  onSelect,
}: ModelSelectorProps) {
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  // Group models by provider
  const modelsByProvider = AVAILABLE_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<Provider, typeof AVAILABLE_MODELS>
  );

  return (
    <Card className="thunderdome-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm thunderdome-header flex items-center justify-between">
          <span>SLOT {slot}</span>
          {selectedModel && (
            <Badge className={providerColors[selectedModel.provider]}>
              {providerLabels[selectedModel.provider]}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedModelId || ""}
          onValueChange={(value) => onSelect(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(modelsByProvider) as Provider[]).map((provider) => (
              <div key={provider}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {providerLabels[provider]}
                </div>
                {modelsByProvider[provider].map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedModel && (
          <p className="mt-2 text-xs text-muted-foreground">
            Context: {selectedModel.contextWindow.toLocaleString()} tokens
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ModelSelectorGridProps {
  getModelIdForSlot: (slot: 1 | 2 | 3) => string | null;
  onSelectModel: (slot: 1 | 2 | 3, modelId: string) => void;
  onClearModel: (slot: 1 | 2 | 3) => void;
}

export function ModelSelectorGrid({
  getModelIdForSlot,
  onSelectModel,
  onClearModel,
}: ModelSelectorGridProps) {
  return (
    <Card className="thunderdome-panel">
      <CardHeader>
        <CardTitle className="thunderdome-header">SELECT MODELS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((slot) => (
            <ModelSelector
              key={slot}
              slot={slot}
              selectedModelId={getModelIdForSlot(slot)}
              onSelect={(modelId) => onSelectModel(slot, modelId)}
              onClear={() => onClearModel(slot)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
