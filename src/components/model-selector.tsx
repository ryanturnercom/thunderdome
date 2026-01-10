"use client";

import { useState, useEffect } from "react";
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

// Get unique providers from available models
const providers = [...new Set(AVAILABLE_MODELS.map((m) => m.provider))] as Provider[];

export function ModelSelector({
  slot,
  selectedModelId,
  onSelect,
}: ModelSelectorProps) {
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  // Track selected provider separately
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    selectedModel?.provider || null
  );

  // Update provider when model changes externally (e.g., loading a config)
  useEffect(() => {
    if (selectedModel) {
      setSelectedProvider(selectedModel.provider);
    }
  }, [selectedModel]);

  // Get models for the selected provider
  const modelsForProvider = selectedProvider
    ? AVAILABLE_MODELS.filter((m) => m.provider === selectedProvider)
    : [];

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider as Provider);
    // Clear the model selection when provider changes
    if (selectedModelId) {
      const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
      if (currentModel?.provider !== provider) {
        // Select the first model of the new provider by default
        const firstModel = AVAILABLE_MODELS.find((m) => m.provider === provider);
        if (firstModel) {
          onSelect(firstModel.id);
        }
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    onSelect(modelId);
  };

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
      <CardContent className="space-y-3">
        {/* Provider Selection */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
          <Select
            value={selectedProvider || ""}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider..." />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${providerColors[provider]}`} />
                    {providerLabels[provider]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Model</label>
          <Select
            value={selectedModelId || ""}
            onValueChange={handleModelChange}
            disabled={!selectedProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedProvider ? "Select model..." : "Select provider first"} />
            </SelectTrigger>
            <SelectContent>
              {modelsForProvider.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <p className="text-xs text-muted-foreground">
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
