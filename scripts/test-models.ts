#!/usr/bin/env npx tsx
/**
 * Model connectivity test script
 * Tests all available models with a simple "test" prompt
 * Uses the actual model configuration from models.ts including maxOutputTokens
 * Run with: npm run test:models
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import the actual model definitions
import { AVAILABLE_MODELS, ModelDefinition } from "../src/types/models";

interface TestResult {
  modelId: string;
  modelName: string;
  provider: string;
  maxOutputTokens: number | null;
  status: "success" | "error" | "skipped";
  latencyMs?: number;
  error?: string;
  response?: string;
}

// Initialize clients
const openaiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const googleKey = process.env.GOOGLE_AI_API_KEY;

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
const google = googleKey ? new GoogleGenerativeAI(googleKey) : null;

const TEST_PROMPT = "Reply with just the word 'ok'";
const TIMEOUT_MS = 30000;

async function testOpenAI(
  modelId: string,
  maxTokens: number | null
): Promise<{ response?: string; error?: string }> {
  if (!openai) return { error: "No API key configured" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: modelId,
        messages: [{ role: "user", content: TEST_PROMPT }],
        // Only include max_tokens if the model supports it (not null)
        ...(maxTokens !== null && { max_tokens: 10 }),
      },
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    return { response: completion.choices[0]?.message?.content || "" };
  } catch (err) {
    clearTimeout(timeout);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function testAnthropic(
  modelId: string,
  maxTokens: number | null
): Promise<{ response?: string; error?: string }> {
  if (!anthropic) return { error: "No API key configured" };

  try {
    const message = await anthropic.messages.create({
      model: modelId,
      // Use configured max or small test value, Anthropic requires this param
      max_tokens: maxTokens !== null ? Math.min(maxTokens, 100) : 100,
      messages: [{ role: "user", content: TEST_PROMPT }],
    });
    const content = message.content[0];
    return { response: content.type === "text" ? content.text : "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function testGoogle(
  modelId: string,
  maxTokens: number | null
): Promise<{ response?: string; error?: string }> {
  if (!google) return { error: "No API key configured" };

  try {
    const model = google.getGenerativeModel({
      model: modelId,
      generationConfig: {
        ...(maxTokens !== null && { maxOutputTokens: Math.min(maxTokens, 100) }),
      },
    });
    const result = await model.generateContent(TEST_PROMPT);
    return { response: result.response.text() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function testModel(model: ModelDefinition): Promise<TestResult> {
  const start = Date.now();

  let result: { response?: string; error?: string };

  switch (model.provider) {
    case "openai":
      result = await testOpenAI(model.id, model.maxOutputTokens);
      break;
    case "anthropic":
      result = await testAnthropic(model.id, model.maxOutputTokens);
      break;
    case "google":
      result = await testGoogle(model.id, model.maxOutputTokens);
      break;
    default:
      result = { error: "Unknown provider" };
  }

  const latencyMs = Date.now() - start;

  if (result.error?.includes("No API key")) {
    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      maxOutputTokens: model.maxOutputTokens,
      status: "skipped",
      error: result.error,
    };
  }

  return {
    modelId: model.id,
    modelName: model.name,
    provider: model.provider,
    maxOutputTokens: model.maxOutputTokens,
    status: result.error ? "error" : "success",
    latencyMs,
    error: result.error,
    response: result.response?.slice(0, 50),
  };
}

function printReport(results: TestResult[]) {
  console.log("\n" + "=".repeat(100));
  console.log("MODEL CONNECTIVITY TEST REPORT (using maxOutputTokens from models.ts)");
  console.log("=".repeat(100) + "\n");

  // Group by provider
  const byProvider = new Map<string, TestResult[]>();
  for (const r of results) {
    const arr = byProvider.get(r.provider) || [];
    arr.push(r);
    byProvider.set(r.provider, arr);
  }

  // Print by provider
  for (const [provider, providerResults] of byProvider) {
    const working = providerResults.filter((r) => r.status === "success").length;
    const failed = providerResults.filter((r) => r.status === "error").length;
    const skipped = providerResults.filter((r) => r.status === "skipped").length;

    console.log(`\n${provider.toUpperCase()} (${working} working, ${failed} failed, ${skipped} skipped)`);
    console.log("-".repeat(90));

    for (const r of providerResults) {
      const icon = r.status === "success" ? "[OK]" : r.status === "skipped" ? "[--]" : "[X]";
      const latency = r.latencyMs ? `${r.latencyMs}ms` : "";
      const maxTok = r.maxOutputTokens !== null ? `${r.maxOutputTokens}` : "null";
      const detail = r.error ? `Error: ${r.error.slice(0, 40)}` : r.response || "";

      console.log(`  ${icon} ${r.modelName.padEnd(28)} max:${maxTok.padStart(6)} ${latency.padStart(8)}  ${detail}`);
    }
  }

  // Summary
  const total = results.length;
  const success = results.filter((r) => r.status === "success").length;
  const errors = results.filter((r) => r.status === "error").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log("\n" + "=".repeat(100));
  console.log(`SUMMARY: ${success}/${total} working | ${errors} failed | ${skipped} skipped`);
  console.log("=".repeat(100) + "\n");
}

async function main() {
  console.log("Testing model connectivity...\n");
  console.log("API Keys configured:");
  console.log(`  OpenAI:    ${openaiKey ? "Yes" : "No"}`);
  console.log(`  Anthropic: ${anthropicKey ? "Yes" : "No"}`);
  console.log(`  Google:    ${googleKey ? "Yes" : "No"}`);
  console.log(`\nTesting ${AVAILABLE_MODELS.length} models (this may take a few minutes)...\n`);

  const results: TestResult[] = [];

  // Test models sequentially to avoid rate limits
  for (const model of AVAILABLE_MODELS) {
    process.stdout.write(`Testing ${model.name}...`);
    const result = await testModel(model);
    results.push(result);

    const icon = result.status === "success" ? "OK" : result.status === "skipped" ? "SKIP" : "FAIL";
    console.log(` ${icon}`);
  }

  printReport(results);
}

main().catch(console.error);
