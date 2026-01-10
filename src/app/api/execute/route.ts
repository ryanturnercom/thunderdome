import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { AVAILABLE_MODELS, ExecutionRequest, StreamChunk } from "@/types/models";
import { streamOpenAIResponse } from "@/lib/clients/openai";
import { streamAnthropicResponse } from "@/lib/clients/anthropic";
import { streamGoogleResponse } from "@/lib/clients/google";

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await getSession();
  if (!session.isAuthenticated) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse request body
  let body: ExecutionRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { systemPrompt, userPrompt, models } = body;

  if (!systemPrompt || !userPrompt || !models || models.length === 0) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Validate all selected models exist
  const validModels = models.filter((m) =>
    AVAILABLE_MODELS.some((am) => am.id === m.modelId)
  );

  if (validModels.length === 0) {
    return new Response("No valid models selected", { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendChunk = (chunk: StreamChunk) => {
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Track completion for each model
      const completionPromises: Promise<void>[] = [];

      for (const selectedModel of validModels) {
        const modelDef = AVAILABLE_MODELS.find(
          (m) => m.id === selectedModel.modelId
        );
        if (!modelDef) continue;

        const startTime = Date.now();

        const promise = new Promise<void>((resolve) => {
          const onChunk = (content: string) => {
            sendChunk({
              modelId: selectedModel.modelId,
              type: "content",
              content,
            });
          };

          const onDone = (usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
          }) => {
            sendChunk({
              modelId: selectedModel.modelId,
              type: "done",
              finishReason: "stop",
              usage,
              latencyMs: Date.now() - startTime,
            });
            resolve();
          };

          const onError = (error: Error) => {
            sendChunk({
              modelId: selectedModel.modelId,
              type: "error",
              error: error.message,
              latencyMs: Date.now() - startTime,
            });
            resolve();
          };

          // Route to appropriate provider
          switch (modelDef.provider) {
            case "openai":
              streamOpenAIResponse({
                model: selectedModel.modelId,
                systemPrompt,
                userPrompt,
                onChunk,
                onDone,
                onError,
              });
              break;
            case "anthropic":
              streamAnthropicResponse({
                model: selectedModel.modelId,
                systemPrompt,
                userPrompt,
                onChunk,
                onDone,
                onError,
              });
              break;
            case "google":
              streamGoogleResponse({
                model: selectedModel.modelId,
                systemPrompt,
                userPrompt,
                onChunk,
                onDone,
                onError,
              });
              break;
            default:
              onError(new Error(`Unknown provider: ${modelDef.provider}`));
          }
        });

        completionPromises.push(promise);
      }

      // Wait for all models to complete
      await Promise.all(completionPromises);

      // Close the stream
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
