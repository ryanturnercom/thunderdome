import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!env.anthropicApiKey) {
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.anthropicApiKey,
    });
  }

  return anthropicClient;
}

export interface AnthropicStreamOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null; // null uses default of 8192
  onChunk: (content: string) => void;
  onDone: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
}

export async function streamAnthropicResponse({
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  onChunk,
  onDone,
  onError,
}: AnthropicStreamOptions): Promise<void> {
  const client = getAnthropicClient();
  if (!client) {
    onError(new Error("Anthropic client not configured"));
    return;
  }

  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens ?? 8192, // Anthropic requires max_tokens
      ...(systemPrompt && { system: systemPrompt }),
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        onChunk(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();
    onDone({
      promptTokens: finalMessage.usage.input_tokens,
      completionTokens: finalMessage.usage.output_tokens,
      totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
    });
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
