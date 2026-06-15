import { NextResponse } from "next/server";

type EmailReportRequest = {
  to?: string;
  report?: {
    company?: string;
    name?: string;
    role?: string;
    totalScore?: number;
    maturityLevel?: string;
    primaryConstraint?: string;
    strongestCapability?: string;
    weakestCapability?: string;
    executiveSummary?: string;
    benchmarkAnswers?: Record<string, string>;
    actionPlan?: string;
  };
};

function buildReportText(payload: NonNullable<EmailReportRequest["report"]>) {
  const benchmarkSummary = Object.entries(payload.benchmarkAnswers || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return [
    "MomentumOS Executive Report",
    "",
    `Company: ${payload.company || "Not provided"}`,
    `Name: ${payload.name || "Not provided"}`,
    `Role: ${payload.role || "Not provided"}`,
    `Momentum Score: ${payload.totalScore || 0}/100`,
    `Maturity Level: ${payload.maturityLevel || "Not provided"}`,
    `Primary Constraint: ${payload.primaryConstraint || "Not provided"}`,
    `Strongest Capability: ${payload.strongestCapability || "Not provided"}`,
    `Weakest Capability: ${payload.weakestCapability || "Not provided"}`,
    "",
    "Executive Summary",
    payload.executiveSummary || "Not provided",
    "",
    "Benchmark Inputs",
    benchmarkSummary || "Not provided",
    "",
    "Full Action Plan",
    payload.actionPlan || "Not generated"
  ].join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json()) as EmailReportRequest;

  if (!body.to || !body.report) {
    return NextResponse.json({ status: "error", message: "Missing email or report content" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REPORT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({ status: "coming_soon", message: "Email delivery coming soon" }, { status: 200 });
  }

  const text = buildReportText(body.report);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [body.to],
        subject: "Your MomentumOS Executive Report",
        text
      })
    });

    if (!response.ok) {
      return NextResponse.json({ status: "error", message: "Unable to email report. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ status: "success", message: "Report emailed successfully" });
  } catch {
    return NextResponse.json({ status: "error", message: "Unable to email report. Please try again." }, { status: 500 });
  }
}
