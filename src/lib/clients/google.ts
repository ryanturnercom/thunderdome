import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

let googleClient: GoogleGenerativeAI | null = null;

export function getGoogleClient(): GoogleGenerativeAI | null {
  if (!env.googleAiApiKey) {
    return null;
  }

  if (!googleClient) {
    googleClient = new GoogleGenerativeAI(env.googleAiApiKey);
  }

  return googleClient;
}

export interface GoogleStreamOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null; // null uses default
  onChunk: (content: string) => void;
  onDone: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
}

export async function streamGoogleResponse({
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  onChunk,
  onDone,
  onError,
}: GoogleStreamOptions): Promise<void> {
  const client = getGoogleClient();
  if (!client) {
    onError(new Error("Google AI client not configured"));
    return;
  }

  try {
    const generativeModel = client.getGenerativeModel({
      model,
      ...(systemPrompt && { systemInstruction: systemPrompt }),
      generationConfig: {
        ...(maxTokens !== null && { maxOutputTokens: maxTokens }),
      },
    });

    const result = await generativeModel.generateContentStream(userPrompt);

    let totalText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        totalText += text;
        onChunk(text);
      }
    }

    // Get usage metadata from the response
    const response = await result.response;
    const usageMetadata = response.usageMetadata;

    onDone({
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    });
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
