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

type CortaveDebug = {
  endpoint?: string;
  httpStatus?: number | "skipped";
  message?: string;
  topLevelKeys?: string[];
  optimisedPromptField?: string;
};

type CortaveResponse = {
  optimized_prompt?: string;
  optimizedPrompt?: string;
  optimisedPrompt?: string;
  prompt?: string;
  output?: string | Array<{ content?: string | Array<{ text?: string }> }>;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  data?: {
    optimized_prompt?: string;
    optimizedPrompt?: string;
    optimisedPrompt?: string;
    prompt?: string;
    output?: string;
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
  const cortaveUrl = process.env.CORTAVE_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const cortaveApiKey = process.env.CORTAVE_API_KEY;

  if (!cortaveApiKey) {
    console.log("Cortave response status", "skipped");
    console.log("Falling back to original prompt", {
      reason: "Cortave status: failed - missing CORTAVE_API_KEY"
    });

    return {
      prompt,
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      debug: {
        endpoint: cortaveUrl,
        message: "missing CORTAVE_API_KEY",
        topLevelKeys: [],
        optimisedPromptField: "none"
      },
      error: "missing CORTAVE_API_KEY"
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
        model: process.env.CORTAVE_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You optimise prompts. Compress the user prompt while preserving all business context, constraints, and required output sections. Return only the optimised prompt text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1
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

    const topLevelKeys = Object.keys(data);

    if (!response.ok) {
      console.error("Cortave response body if error", {
        endpoint: cortaveUrl,
        status: response.status,
        body: responseBody
      });
      console.log("Falling back to original prompt", {
        reason: `Cortave failed with status ${response.status}.`
      });

      return {
        prompt,
        usedCortave: false,
        status: "failed" as CortaveStatus,
        metrics: null,
        debug: {
          endpoint: cortaveUrl,
          httpStatus: response.status,
          message: getShortCortaveError(responseBody) || `Cortave failed with status ${response.status}.`,
          topLevelKeys,
          optimisedPromptField: "none"
        },
        error: `Cortave failed with status ${response.status}.`
      };
    }

    const extractedPrompt = extractOptimisedPrompt(data);
    const optimisedPrompt = extractedPrompt.prompt || prompt;

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
      console.log("Using optimised prompt", {
        field: extractedPrompt.field,
        topLevelKeys
      });
    } else {
      console.log("Falling back to original prompt", {
        reason: "Cortave did not return a different optimised prompt.",
        topLevelKeys
      });
    }

    return {
      prompt: optimisedPrompt,
      usedCortave: Boolean(extractedPrompt.prompt),
      status: extractedPrompt.prompt ? ("success" as CortaveStatus) : ("failed" as CortaveStatus),
      metrics,
      debug: {
        endpoint: cortaveUrl,
        httpStatus: response.status,
        message: extractedPrompt.prompt ? "Cortave optimisation succeeded." : "Cortave did not return an optimised prompt field.",
        topLevelKeys,
        optimisedPromptField: extractedPrompt.field || "none"
      },
      error: null
    };
  } catch (error) {
    console.error("Cortave response body if error", {
      endpoint: cortaveUrl,
      error
    });
    console.log("Falling back to original prompt", {
      reason: error instanceof Error ? error.message : "Cortave request failed."
    });

    return {
      prompt,
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      debug: {
        endpoint: cortaveUrl,
        message: error instanceof Error ? error.message : "Cortave request failed.",
        optimisedPromptField: "none"
      },
      error: error instanceof Error ? error.message : "Cortave request failed."
    };
  }
}

function getShortCortaveError(responseBody: string) {
  if (!responseBody) return "";

  try {
    const parsed = JSON.parse(responseBody) as {
      error?: string | { message?: string };
      message?: string;
      detail?: string;
    };

    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.message) return parsed.message;
    if (parsed.detail) return parsed.detail;
  } catch {
    return responseBody.slice(0, 240);
  }

  return responseBody.slice(0, 240);
}

function extractOptimisedPrompt(data: CortaveResponse) {
  const candidates: Array<[string, unknown]> = [
    ["response.choices[0].message.content", data.choices?.[0]?.message?.content],
    ["response.optimized_prompt", data.optimized_prompt],
    ["response.optimisedPrompt", data.optimisedPrompt],
    ["response.optimizedPrompt", data.optimizedPrompt],
    ["response.prompt", data.prompt],
    ["response.output", typeof data.output === "string" ? data.output : undefined],
    ["response.data.optimized_prompt", data.data?.optimized_prompt],
    ["response.data.optimisedPrompt", data.data?.optimisedPrompt],
    ["response.data.optimizedPrompt", data.data?.optimizedPrompt],
    ["response.data.prompt", data.data?.prompt],
    ["response.data.output", data.data?.output]
  ];

  for (const [field, value] of candidates) {
    if (typeof value === "string" && value.trim()) {
      return { prompt: value.trim(), field };
    }
  }

  const outputContent = Array.isArray(data.output) ? data.output[0]?.content : undefined;
  if (typeof outputContent === "string" && outputContent.trim()) {
    return { prompt: outputContent.trim(), field: "response.output[0].content" };
  }

  if (Array.isArray(outputContent)) {
    const text = outputContent
      .map((item) => item.text)
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (text) {
      return { prompt: text, field: "response.output[0].content[].text" };
    }
  }

  return { prompt: "", field: "" };
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
      debug: cortaveResult.debug satisfies CortaveDebug,
      fallbackReason: cortaveResult.error
    },
    cortaveStatus: cortaveResult.status
  });
}
