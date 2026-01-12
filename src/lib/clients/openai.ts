import OpenAI from "openai";
import { env } from "@/lib/env";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!env.openaiApiKey) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey,
    });
  }

  return openaiClient;
}

export interface OpenAIStreamOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null; // null = don't send parameter
  onChunk: (content: string) => void;
  onDone: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
}

// GPT-5.x and o1/o3 models don't support system messages in the same way
function isReasoningModel(model: string): boolean {
  return model.startsWith("o1") || model.startsWith("o3") || model.startsWith("gpt-5");
}

export async function streamOpenAIResponse({
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  onChunk,
  onDone,
  onError,
}: OpenAIStreamOptions): Promise<void> {
  const client = getOpenAIClient();
  if (!client) {
    onError(new Error("OpenAI client not configured"));
    return;
  }

  try {
    // Build messages array - reasoning models handle system prompts differently
    const messages: OpenAI.ChatCompletionMessageParam[] = isReasoningModel(model)
      ? [
          // For reasoning models, prepend system context to user message
          {
            role: "user",
            content: systemPrompt
              ? `${systemPrompt}\n\n${userPrompt}`
              : userPrompt,
          },
        ]
      : [
          // Standard models use separate system message
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: userPrompt },
        ];

    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      // Only include max_tokens if specified (reasoning models don't support it)
      ...(maxTokens !== null && { max_tokens: maxTokens }),
    });

    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }

      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    onDone(usage);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
