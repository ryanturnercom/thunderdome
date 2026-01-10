import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getGoogleClient } from "@/lib/clients/google";
import { AVAILABLE_MODELS } from "@/types/models";

interface EvaluationRequest {
  originalPrompt: string;
  systemPrompt: string;
  responses: {
    modelId: string;
    content: string;
  }[];
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body: EvaluationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { originalPrompt, systemPrompt, responses } = body;

  if (!originalPrompt || !responses || responses.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 responses to evaluate" },
      { status: 400 }
    );
  }

  const client = getGoogleClient();
  if (!client) {
    return NextResponse.json(
      { error: "Google AI not configured" },
      { status: 500 }
    );
  }

  try {
    // Build the evaluation prompt
    const modelResponses = responses
      .map((r) => {
        const model = AVAILABLE_MODELS.find((m) => m.id === r.modelId);
        const modelName = model?.name || r.modelId;
        return `### ${modelName}\n${r.content}`;
      })
      .join("\n\n---\n\n");

    const evaluationPrompt = `You are an expert evaluator comparing AI model responses. Analyze the following responses to the same prompt and provide a detailed comparison.

## Original System Prompt
${systemPrompt || "(No system prompt provided)"}

## Original User Prompt
${originalPrompt}

## Model Responses

${modelResponses}

---

## Your Task

Provide a comprehensive evaluation that includes:

1. **Summary**: A brief overview of how each model approached the task (2-3 sentences each)

2. **Strengths & Weaknesses**: For each response, identify:
   - Key strengths
   - Notable weaknesses or gaps

3. **Comparison Criteria**: Rate each response on these dimensions (1-5 scale):
   - Accuracy/Correctness
   - Completeness
   - Clarity & Organization
   - Helpfulness
   - Creativity (if applicable)

4. **Winner**: Declare which response best addresses the prompt and explain why

5. **Recommendation**: Suggest which model might be best suited for this type of task

Be objective and specific in your analysis. Reference specific parts of each response when making comparisons.`;

    const generativeModel = client.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const result = await generativeModel.generateContent(evaluationPrompt);
    const evaluation = result.response.text();

    return NextResponse.json({
      evaluation,
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens:
          result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      },
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
