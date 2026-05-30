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
  optimized_prompt?: string;
  optimizedPrompt?: string;
  optimisedPrompt?: string;
  prompt?: string;
  completion?: string;
  response?: string;
  text?: string;
  output?: string | Array<{ content?: string | Array<{ text?: string }> }>;
  choices?: Array<{
    text?: string;
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

function getSemanticGatewayHeaders(response: Response) {
  return {
    source: response.headers.get("x-sg-source"),
    confidence: response.headers.get("x-sg-confidence"),
    contextDocs: response.headers.get("x-sg-context-docs"),
    modelFallback: response.headers.get("x-sg-model-fallback")
  };
}

async function generateActionPlanWithCortave(prompt: string) {
  const cortaveUrl = "https://api.semanticgateway.com/v1/chat/completions";
  const cortaveApiKeyExists = Boolean(process.env.CORTAVE_API_KEY);

  if (!cortaveUrl) {
    console.log("Cortave response status", "failed - missing CORTAVE_API_URL");
    console.log("Falling back to original prompt", {
      reason: "Cortave status: failed - missing CORTAVE_API_URL"
    });

    return {
      prompt,
      actionPlan: "",
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      debug: {
        endpoint: cortaveUrl,
        message: "missing CORTAVE_API_URL",
        topLevelKeys: [],
        optimisedPromptField: "none",
        cortaveApiKeyExists,
        authorizationHeaderAttached: false
      },
      error: "missing CORTAVE_API_URL"
    };
  }

  if (!cortaveApiKeyExists) {
    console.log("Cortave response status", "failed - missing CORTAVE_API_KEY");
    console.log("Falling back to original prompt", {
      reason: "Cortave status: failed - missing CORTAVE_API_KEY"
    });

    return {
      prompt,
      actionPlan: "",
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      debug: {
        endpoint: cortaveUrl,
        message: "missing CORTAVE_API_KEY",
        topLevelKeys: [],
        optimisedPromptField: "none",
        cortaveApiKeyExists,
        authorizationHeaderAttached: false
      },
      error: "missing CORTAVE_API_KEY"
    };
  }

  try {
    console.log("Calling Cortave optimisation");
    const authorizationHeaderAttached = true;

    const response = await fetch(cortaveUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CORTAVE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert ecosystem revenue strategist. Generate clear, practical, executive-level recommendations in the exact structure requested by the user."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const responseBody = await response.text();
    const semanticGatewayHeaders = getSemanticGatewayHeaders(response);
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
        actionPlan: "",
        usedCortave: false,
        status: "failed" as CortaveStatus,
        metrics: null,
        debug: {
          endpoint: cortaveUrl,
          httpStatus: response.status,
          message: getShortCortaveError(responseBody) || `Cortave failed with status ${response.status}.`,
          semanticGateway: semanticGatewayHeaders,
          topLevelKeys,
          optimisedPromptField: "none",
          cortaveApiKeyExists,
          authorizationHeaderAttached
        },
        error: `Cortave failed with status ${response.status}.`
      };
    }

    const extractedActionPlan = extractOptimisedPrompt(data);
    const actionPlan = extractedActionPlan.prompt;

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

    if (actionPlan) {
      console.log("Using Cortave Semantic Gateway action plan", {
        field: extractedActionPlan.field,
        topLevelKeys
      });
    } else {
      console.log("Falling back to original prompt", {
        reason: "Cortave did not return choices[0].message.content.",
        topLevelKeys
      });
    }

    return {
      prompt,
      actionPlan,
      usedCortave: Boolean(actionPlan),
      status: actionPlan ? ("success" as CortaveStatus) : ("failed" as CortaveStatus),
      metrics,
      debug: {
        endpoint: cortaveUrl,
        httpStatus: response.status,
        message: actionPlan ? "Cortave Semantic Gateway generation succeeded." : "Cortave did not return choices[0].message.content.",
        semanticGateway: semanticGatewayHeaders,
        topLevelKeys,
        optimisedPromptField: extractedActionPlan.field || "none",
        cortaveApiKeyExists,
        authorizationHeaderAttached
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
      actionPlan: "",
      usedCortave: false,
      status: "failed" as CortaveStatus,
      metrics: null,
      debug: {
        endpoint: cortaveUrl,
        message: error instanceof Error ? error.message : "Cortave request failed.",
        semanticGateway: {
          source: null,
          confidence: null,
          contextDocs: null,
          modelFallback: null
        },
        optimisedPromptField: "none",
        cortaveApiKeyExists,
        authorizationHeaderAttached: cortaveApiKeyExists
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
    ["response.choices[0].text", data.choices?.[0]?.text],
    ["response.output", typeof data.output === "string" ? data.output : undefined],
    ["response.completion", data.completion],
    ["response.response", data.response],
    ["response.text", data.text],
    ["response.optimized_prompt", data.optimized_prompt],
    ["response.optimisedPrompt", data.optimisedPrompt],
    ["response.optimizedPrompt", data.optimizedPrompt],
    ["response.prompt", data.prompt],
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

Output exactly these sections in this order, using clear Markdown-style headings:

1. Executive Summary
- Write 3-5 sentences.
- Explain the overall ecosystem maturity.
- Name the biggest bottleneck.
- Name the biggest opportunity.
- Explain the commercial implication for revenue, pipeline, activation, or co-sell momentum.

2. Top 3 Priority Actions
For each priority action, include:
- Priority title
- Impact level: High, Medium, or Low
- Why it matters
- Recommended next action

3. Full Action Plan
- Give practical 30/60/90-day recommendations.
- Tie each recommendation to the user's maturity level, lowest-scoring category, selected bottleneck, and category scores.
- Keep the plan specific to partner-led revenue execution.

4. Book a Review CTA
- Include one concise sentence recommending a MomentumOS Review Session for implementation support.

Keep it practical, executive, and specific to partner-led revenue. Avoid generic transformation language.
`;

  const cortaveResult = await generateActionPlanWithCortave(prompt);
  console.log("Cortave generation complete before fallback decision", {
    cortaveStatus: cortaveResult.status
  });

  if (cortaveResult.status === "success" && cortaveResult.actionPlan) {
    return NextResponse.json({ actionPlan: cortaveResult.actionPlan });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Could not generate your action plan right now. Please try again shortly."
      },
      { status: 500 }
    );
  }

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
            "You are a senior ecosystem revenue strategist. You write concise executive action plans for SaaS, AI, MSP, SI, and technology partner ecosystems in the exact structure requested by the user."
        },
        {
          role: "user",
          content: prompt
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
        error: "Could not generate your action plan right now. Please try again shortly."
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

  return NextResponse.json({ actionPlan });
}
