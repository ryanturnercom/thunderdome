"use client";

import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { SaveConfigDialog } from "./save-config-dialog";
import { LoadConfigDialog } from "./load-config-dialog";
import { useArena } from "@/contexts/arena-context";

export function Header() {
  const {
    prompts,
    selectedModels,
    loadModels,
    setSystemPrompt,
    setUserPrompt,
    isValid,
    isExecuting,
  } = useArena();

  const handleLoadConfig = (config: {
    systemPrompt: string;
    userPrompt: string;
    models: { slot: 1 | 2 | 3; modelId: string }[];
  }) => {
    setSystemPrompt(config.systemPrompt);
    setUserPrompt(config.userPrompt);
    loadModels(config.models);
  };

  return (
    <header className="border-b-2 border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Turner's Thunderdome"
            width={400}
            height={100}
            className="h-20 w-auto"
            priority
          />
        </div>
        <div className="flex items-center gap-3">
          <LoadConfigDialog onLoad={handleLoadConfig} disabled={isExecuting} />
          <SaveConfigDialog
            systemPrompt={prompts.systemPrompt}
            userPrompt={prompts.userPrompt}
            models={selectedModels}
            disabled={!isValid || isExecuting}
          />
          <div className="w-px h-8 bg-border mx-1" />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
