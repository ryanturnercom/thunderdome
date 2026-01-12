"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen, Loader2, Trash2, Link, Check } from "lucide-react";
import { ConfigListItem, ThunderdomeConfig, SavedResponse } from "@/types/config";
import { SelectedModel } from "@/types/models";
import { toast } from "sonner";

interface LoadConfigDialogProps {
  onLoad: (config: {
    id: string;
    systemPrompt: string;
    userPrompt: string;
    models: SelectedModel[];
    responses?: SavedResponse[];
    evaluation?: string;
  }) => void;
  disabled?: boolean;
  autoOpen?: boolean;
}

export function LoadConfigDialog({ onLoad, disabled, autoOpen }: LoadConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState<ConfigListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-open for guests
  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/configs");
      if (!response.ok) {
        throw new Error("Failed to fetch configurations");
      }
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load configurations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchConfigs();
    }
  }, [open]);

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/configs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load configuration");
      }
      const config: ThunderdomeConfig = await response.json();

      onLoad({
        id: config.id,
        systemPrompt: config.systemPrompt,
        userPrompt: config.userPrompt,
        models: config.models,
        responses: config.responses,
        evaluation: config.evaluation,
      });

      toast.success(`Loaded "${config.name}"`);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load configuration"
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}?config=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/configs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete configuration");
      }
      toast.success(`Deleted "${name}"`);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete configuration"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Load Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="thunderdome-header">
            LOAD CONFIGURATION
          </DialogTitle>
          <DialogDescription>
            Select a saved configuration to load.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved configurations yet.</p>
              <p className="text-sm mt-1">
                Save your current setup to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{config.name}</h4>
                    {config.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {config.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {formatDate(config.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyLink(config.id)}
                      title="Copy link"
                    >
                      {copiedId === config.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Link className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(config.id, config.name)}
                      disabled={deletingId === config.id}
                      title="Delete"
                    >
                      {deletingId === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleLoad(config.id)}
                      disabled={loadingId === config.id}
                      className="thunderdome-button"
                    >
                      {loadingId === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Load"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
