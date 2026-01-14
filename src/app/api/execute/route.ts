import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { AVAILABLE_MODELS, ExecutionRequest, StreamChunk } from "@/types/models";
import { streamOpenAIResponse } from "@/lib/clients/openai";
import { streamAnthropicResponse } from "@/lib/clients/anthropic";
import { streamGoogleResponse } from "@/lib/clients/google";
import {
  getClientIP,
  getIPExecutionCount,
  incrementIPExecutionCount,
  isGuestLimitExceeded,
  GUEST_EXECUTION_LIMIT,
  getCurrentDateString,
} from "@/lib/guest-rate-limit";

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await getSession();
  if (!session.isAuthenticated) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check guest execution limit
  if (session.isGuest) {
    const clientIP = getClientIP(request);
    const today = getCurrentDateString();

    // Reset session count if it's a new day
    let sessionCount = session.guestExecutionCount || 0;
    if (session.guestExecutionDate !== today) {
      sessionCount = 0;
      session.guestExecutionCount = 0;
      session.guestExecutionDate = today;
      await session.save();
    }

    const ipCount = getIPExecutionCount(clientIP);

    if (isGuestLimitExceeded(sessionCount, ipCount)) {
      return new Response(
        JSON.stringify({
          error: "Guest limit reached",
          message: `You have reached your daily limit of ${GUEST_EXECUTION_LIMIT} executions as a guest. Please log in to continue or try again tomorrow.`,
          isGuestLimitError: true,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Parse request body
  let body: ExecutionRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { systemPrompt = "", userPrompt, models } = body;

  if (!userPrompt || !models || models.length === 0) {
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
                maxTokens: modelDef.maxOutputTokens,
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
                maxTokens: modelDef.maxOutputTokens,
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
                maxTokens: modelDef.maxOutputTokens,
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

      // Increment guest execution counts (do this BEFORE waiting for completion)
      if (session.isGuest) {
        const clientIP = getClientIP(request);
        const today = getCurrentDateString();
        session.guestExecutionCount = (session.guestExecutionCount || 0) + 1;
        session.guestExecutionDate = today;
        await session.save();
        incrementIPExecutionCount(clientIP);
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
