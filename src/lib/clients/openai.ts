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
  onChunk: (content: string) => void;
  onDone: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
}

export async function streamOpenAIResponse({
  model,
  systemPrompt,
  userPrompt,
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
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      stream_options: { include_usage: true },
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
