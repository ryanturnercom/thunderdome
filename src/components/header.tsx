"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { SaveConfigDialog } from "./save-config-dialog";
import { LoadConfigDialog } from "./load-config-dialog";
import { useArena } from "@/contexts/arena-context";
import { useAuth } from "@/contexts/auth-context";
import { SavedResponse } from "@/types/config";
import { toast } from "sonner";

function playWelcomeSound() {
  const audio = new Audio("/welcome.wav");
  audio.play().catch(() => {});
}

export function Header() {
  const { isGuest, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    prompts,
    selectedModels,
    loadModels,
    setSystemPrompt,
    setUserPrompt,
    isValid,
    isExecuting,
    responses,
    evaluation,
    loadResponses,
    setEvaluation,
    clearResponses,
  } = useArena();

  // Convert Map<string, ModelResponse> to SavedResponse[]
  const savedResponses: SavedResponse[] = Array.from(responses.entries())
    .filter(([, r]) => r.isComplete || r.isError)
    .map(([, r]) => ({
      modelId: r.modelId,
      content: r.content,
      isComplete: r.isComplete,
      isError: r.isError,
      error: r.error,
      usage: r.usage,
      latencyMs: r.latencyMs,
    }));

  const loadConfigById = useCallback(async (configId: string) => {
    try {
      const response = await fetch(`/api/configs/${configId}`);
      if (!response.ok) {
        throw new Error("Configuration not found");
      }
      const config = await response.json();
      
      setSystemPrompt(config.systemPrompt);
      setUserPrompt(config.userPrompt);
      loadModels(config.models);
      
      if (config.responses && config.responses.length > 0) {
        loadResponses(config.responses);
      } else {
        clearResponses();
      }
      
      if (config.evaluation) {
        setEvaluation(config.evaluation);
      } else {
        setEvaluation(null);
      }
      
      toast.success(`Loaded "${config.name}"`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load configuration"
      );
      // Clear the invalid config param from URL
      router.replace("/", { scroll: false });
    }
  }, [setSystemPrompt, setUserPrompt, loadModels, loadResponses, clearResponses, setEvaluation, router]);

  // Auto-load config from URL on mount
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    
    const configId = searchParams.get("config");
    if (configId) {
      loadConfigById(configId);
    }
  }, [searchParams, authLoading, isAuthenticated, loadConfigById]);

  const handleLoadConfig = (config: {
    id: string;
    systemPrompt: string;
    userPrompt: string;
    models: { slot: 1 | 2 | 3; modelId: string }[];
    responses?: SavedResponse[];
    evaluation?: string;
  }) => {
    setSystemPrompt(config.systemPrompt);
    setUserPrompt(config.userPrompt);
    loadModels(config.models);
    
    // Load responses if they exist
    if (config.responses && config.responses.length > 0) {
      loadResponses(config.responses);
    } else {
      clearResponses();
    }
    
    // Load evaluation if it exists
    if (config.evaluation) {
      setEvaluation(config.evaluation);
    } else {
      setEvaluation(null);
    }

    // Update URL with config ID
    router.replace(`/?config=${config.id}`, { scroll: false });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-border bg-card px-6 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Turner's Thunderdome"
            width={800}
            height={200}
            className="h-20 w-auto cursor-pointer"
            priority
            onClick={playWelcomeSound}
          />
        </div>
        <div className="flex items-center gap-3">
          <LoadConfigDialog 
            onLoad={handleLoadConfig} 
            disabled={isExecuting}
            autoOpen={isGuest}
          />
          {!isGuest && (
            <SaveConfigDialog
              systemPrompt={prompts.systemPrompt}
              userPrompt={prompts.userPrompt}
              models={selectedModels}
              responses={savedResponses}
              evaluation={evaluation}
              disabled={!isValid || isExecuting}
            />
          )}
          <div className="w-px h-8 bg-border mx-1" />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
