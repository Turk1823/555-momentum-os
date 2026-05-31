import { NextResponse } from "next/server";

type CompanyAnalysisRequest = {
  companyName?: string;
  averageMomentumScore?: number;
  assessmentCount?: number;
  latestAssessmentDate?: string;
  categoryScores?: Array<{
    label: string;
    value: number;
  }>;
  strongestCategory?: {
    label: string;
    value: number;
  };
  weakestCategory?: {
    label: string;
    value: number;
  };
  leadershipAlignmentScore?: number | null;
  alignmentInsight?: string;
  benchmarkMetrics?: Array<{
    label: string;
    companyScore: number;
    platformAverage: number;
    difference: number;
    status: string;
  }>;
  trendStatus?: string;
  trendChange?: number | null;
  teamAssessmentSummary?: string;
};

const unavailableResponse = {
  error: "Executive analysis unavailable at the moment."
};

function buildPrompt(body: CompanyAnalysisRequest) {
  return `
Create a professional executive briefing for the MomentumOS Platform AI Executive Advisor.

Company metrics:
- Company Name: ${body.companyName || "Not provided"}
- Average Momentum Score: ${body.averageMomentumScore ?? "Not available"}/100
- Assessment Count: ${body.assessmentCount ?? "Not available"}
- Latest Assessment Date: ${body.latestAssessmentDate || "Not available"}
- Category Scores: ${
    body.categoryScores?.map((category) => `${category.label}: ${category.value}/20`).join(", ") || "Not available"
  }
- Strongest Category: ${
    body.strongestCategory ? `${body.strongestCategory.label} (${body.strongestCategory.value}/20)` : "Not available"
  }
- Weakest Category: ${body.weakestCategory ? `${body.weakestCategory.label} (${body.weakestCategory.value}/20)` : "Not available"}
- Leadership Alignment Score: ${
    typeof body.leadershipAlignmentScore === "number" ? `${body.leadershipAlignmentScore}%` : "Not enough team data yet"
  }
- Alignment Insight: ${body.alignmentInsight || "Not available"}
- Benchmark Metrics: ${
    body.benchmarkMetrics
      ?.map(
        (metric) =>
          `${metric.label}: company ${metric.companyScore}, platform average ${metric.platformAverage}, difference ${metric.difference}, status ${metric.status}`
      )
      .join("; ") || "Not available"
  }
- Trend Status: ${body.trendStatus || "Not available"}
- Trend Change: ${typeof body.trendChange === "number" ? body.trendChange : "Not enough historical data yet"}
- Team Assessment Summary: ${body.teamAssessmentSummary || "Not available"}

Generate a concise, professional executive briefing with these exact section headings:

Executive Summary
Current Momentum Score
Benchmark Position
Leadership Alignment Assessment
Trend Assessment
Strongest Capability
Weakest Capability
Top 3 Recommended Priorities
Expected Business Impact
Suggested 90-Day Focus

Use markdown-style plain text headings and bullets, but do not use markdown code fences.
Keep the writing specific to ecosystem revenue, partner activation, co-sell execution, benchmark position, leadership alignment, and 90-day operating priorities.
`;
}

function extractResponseText(data: {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}) {
  return (
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n\n") ||
    ""
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(unavailableResponse, { status: 500 });
  }

  try {
    const body = (await request.json()) as CompanyAnalysisRequest;

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
              "You are a senior ecosystem revenue strategist. You write concise, board-ready executive briefings for SaaS, AI, MSP, SI, and technology partner ecosystems."
          },
          {
            role: "user",
            content: buildPrompt(body)
          }
        ],
        temperature: 0.35
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
      console.error("Company analysis OpenAI request failed:", {
        status: response.status,
        message: data.error?.message
      });

      return NextResponse.json(unavailableResponse, { status: response.status });
    }

    const analysis = extractResponseText(data).trim();

    if (!analysis) {
      return NextResponse.json(unavailableResponse, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Company analysis route failed:", error);
    return NextResponse.json(unavailableResponse, { status: 500 });
  }
}
