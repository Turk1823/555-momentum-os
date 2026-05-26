import { NextResponse } from "next/server";

type ActionPlanRequest = {
  totalScore: number;
  maturityLevel: string;
  lowestScoringCategory: string;
  selectedBottleneck: string;
  companyContext?: {
    company?: string;
    role?: string;
  };
  categoryScores: Array<{
    name: string;
    score: number;
  }>;
};

type CortaveMetrics = {
  originalTokens?: number;
  optimisedTokens?: number;
  tokenSavings?: number;
  compressionPercentage?: number;
};

type CortaveStatus = "success" | "failed" | "skipped";

type CortaveResponse = {
  optimizedPrompt?: string;
  optimisedPrompt?: string;
  prompt?: string;
  data?: {
    optimizedPrompt?: string;
    optimisedPrompt?: string;
    prompt?: string;
    originalTokens?: number;
    original_token_count?: number;
    optimizedTokens?: number;
    optimisedTokens?: number;
    optimized_token_count?: number;
    tokenSavings?: number;
    token_savings?: number;
    compressionPercentage?: number;
    compression_percentage?: number;
  };
  originalTokens?: number;
  original_token_count?: number;
  optimizedTokens?: number;
  optimisedTokens?: number;
  optimized_token_count?: number;
  tokenSavings?: number;
  token_savings?: number;
  compressionPercentage?: number;
  compression_percentage?: number;
};

async function optimisePromptWithCortave(prompt: string) {
  const cortaveUrl = process.env.CORTAVE_API_URL;
  const cortaveApiKey = process.env.CORTAVE_API_KEY;

  if (!cortaveUrl || !cortaveApiKey) {
    console.log("Cortave response status", "skipped");
    console.log("Falling back to original prompt", {
      reason: "Cortave is not configured."
    });

    return {
      prompt,
      usedCortave: false,
      status: "skipped" as CortaveStatus,
      metrics: null,
      error: "Cortave is not configured."
    };
  }

  try {
    console.log("Calling Cortave optimisation");

    const response = await fetch(cortaveUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cortaveApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        task: "optimise_prompt",
        goal: "Compress and optimise this prompt while preserving all business context and required output sections."
      })
    });

    const responseBody = await response.text();
    console.log("Cortave response status", response.status);

    let data: CortaveResponse = {};

    try {
      data = responseBody ? (JSON.parse(responseBody) as CortaveResponse) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error("Cortave response body if error", responseBody);
      console.log("Falling back to original prompt", {
        reason: `Cortave failed with status ${response.status}.`
      });

      return {
        prompt,
        usedCortave: false,
        status: "failed" as CortaveStatus,
        metrics: null,
        error: `Cortave failed with status ${response.status}.`
      };
    }

    const optimisedPrompt =
      data.optimizedPrompt ||
      data.optimisedPrompt ||
      data.prompt ||
      data.data?.optimizedPrompt ||
      data.data?.optimisedPrompt ||
      data.data?.prompt ||
      prompt;

    const metrics: CortaveMetrics = {
      originalTokens: data.originalTokens ?? data.original_token_count ?? data.data?.originalTokens ?? data.data?.original_token_count,
      optimisedTokens:
        data.optimizedTokens ??
        data.optimisedTokens ??
        data.optimized_token_count ??
        data.data?.optimizedTokens ??
        data.data?.optimisedTokens ??
        data.data?.optimized_token_count,
      tokenSavings: data.tokenSavings ?? data.token_savings ?? data.data?.tokenSavings ?? data.data?.token_savings,
      compressionPercentage:
        data.compressionPercentage ??
        data.compression_percentage ??
        data.data?.compressionPercentage ??
        data.data?.compression_percentage
    };

    if (optimisedPrompt !== prompt) {
      console.log("Using optimised prompt");
    } else {
      console.log("Falling back to original prompt", {
        reason: "Cortave did not return a different optimised prompt."
      });
    }

    return {
      prompt: optimisedPrompt,
      usedCortave: optimisedPrompt !== prompt,
      status: optimisedPrompt !== prompt ? ("success" as CortaveStatus) : ("failed" as CortaveStatus),
      metrics,
      error: null
    };
  } catch (error) {
    console.error("Cortave response body if error", error);
    console.log("Falling back to original prompt", {
      reason: error instanceof Error ? error.message : "Cortave request failed."
    });

    return {
      prompt,
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      error: error instanceof Error ? error.message : "Cortave request failed."
    };
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured on the server."
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as ActionPlanRequest;

  const prompt = `
Create a concise, board-ready ecosystem revenue action plan for the 555 MomentumOS beta.

Assessment context:
- Total score: ${body.totalScore}/100
- Maturity level: ${body.maturityLevel}
- Category scores: ${body.categoryScores.map((category) => `${category.name}: ${category.score}/20`).join(", ")}
- Lowest scoring category: ${body.lowestScoringCategory}
- Selected bottleneck: ${body.selectedBottleneck}
- Company: ${body.companyContext?.company || "Not provided"}
- User role: ${body.companyContext?.role || "Not provided"}

Output exactly these sections:
1. Executive summary
2. Top 3 ecosystem risks
3. Fastest revenue momentum lever
4. 30/60/90-day action plan
5. Recommended next service option

Keep it practical, executive, and specific to partner-led revenue. Avoid generic transformation language.
`;

  const cortaveResult = await optimisePromptWithCortave(prompt);
  console.log("Cortave optimisation complete before OpenAI", {
    cortaveStatus: cortaveResult.status
  });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a senior ecosystem revenue strategist. You write concise executive action plans for SaaS, AI, MSP, SI, and technology partner ecosystems."
        },
        {
          role: "user",
          content: cortaveResult.prompt
        }
      ],
      temperature: 0.4
    })
  });

  const data = (await response.json()) as {
    output_text?: string;
    error?: { message?: string };
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        error: data.error?.message || "OpenAI action plan generation failed."
      },
      { status: response.status }
    );
  }

  const actionPlan =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n\n") ||
    "";

  return NextResponse.json({
    actionPlan,
    cortave: {
      optimised: cortaveResult.usedCortave,
      status: cortaveResult.status,
      metrics: cortaveResult.metrics,
      fallbackReason: cortaveResult.error
    },
    cortaveStatus: cortaveResult.status
  });
}
