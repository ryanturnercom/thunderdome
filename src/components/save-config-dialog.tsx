"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { SelectedModel } from "@/types/models";
import { SavedResponse } from "@/types/config";
import { toast } from "sonner";

interface SaveConfigDialogProps {
  systemPrompt: string;
  userPrompt: string;
  models: SelectedModel[];
  responses?: SavedResponse[];
  evaluation?: string | null;
  disabled?: boolean;
}

export function SaveConfigDialog({
  systemPrompt,
  userPrompt,
  models,
  responses,
  evaluation,
  disabled,
}: SaveConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          systemPrompt,
          userPrompt,
          models,
          responses: responses && responses.length > 0 ? responses : undefined,
          evaluation: evaluation || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      toast.success("Configuration saved successfully");
      setOpen(false);
      setName("");
      setDescription("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save configuration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const responseCount = responses?.length ?? 0;
  const hasEvaluation = !!evaluation;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Save className="mr-2 h-4 w-4" />
          Save Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="thunderdome-header">
            SAVE CONFIGURATION
          </DialogTitle>
          <DialogDescription>
            Save your current prompt, model configuration, and results for later use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome config"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this configuration for?"
              rows={3}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This will save:</p>
            <ul className="list-disc list-inside mt-1">
              <li>System prompt ({systemPrompt.length} chars)</li>
              <li>User prompt ({userPrompt.length} chars)</li>
              <li>{models.length} selected model(s)</li>
              {responseCount > 0 && (
                <li className="text-green-600 dark:text-green-400">
                  {responseCount} model response(s)
                </li>
              )}
              {hasEvaluation && (
                <li className="text-green-600 dark:text-green-400">
                  Evaluation result
                </li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="thunderdome-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
