"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PromptInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function PromptInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 10000,
}: PromptInputProps) {
  const charCount = value.length;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied", {
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast.error("Failed to copy", {
        description: "Could not copy to clipboard",
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="thunderdome-header text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mono">
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
          >
            Copy
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="min-h-[150px] resize-y font-mono text-sm"
      />
    </div>
  );
}
