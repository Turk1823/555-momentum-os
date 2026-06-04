import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BetaAccessRequestPayload = {
  firstName?: string;
  workEmail?: string;
  company?: string;
  roleTitle?: string;
  assessmentId?: string;
  momentumScore?: number;
  primaryConstraint?: string;
  maturityLevel?: string;
  strongestCategory?: string;
  weakestCategory?: string;
  createdAt?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as BetaAccessRequestPayload | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const workEmail = cleanText(payload.workEmail);

  if (!workEmail) {
    return NextResponse.json({ error: "A work email is required to request beta access." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    console.error("MomentumOS beta access request failed - Supabase is not configured");
    return NextResponse.json({ error: "Sorry, we couldn't record your request. Please try again." }, { status: 500 });
  }

  const createdAt = cleanText(payload.createdAt) || new Date().toISOString();
  const insertPayload = {
    submission_id: cleanText(payload.assessmentId) || null,
    first_name: cleanText(payload.firstName),
    work_email: workEmail,
    company: cleanText(payload.company),
    role_title: cleanText(payload.roleTitle),
    momentum_score: Number.isFinite(payload.momentumScore) ? payload.momentumScore : null,
    primary_constraint: cleanText(payload.primaryConstraint),
    maturity_level: cleanText(payload.maturityLevel),
    strongest_category: cleanText(payload.strongestCategory),
    weakest_category: cleanText(payload.weakestCategory),
    status: "new",
    created_at: createdAt
  };

  const { error } = await supabase.from("momentumos_beta_access_requests").insert(insertPayload);

  if (error) {
    console.error("MomentumOS beta access request insert failed", {
      workEmail,
      company: insertPayload.company,
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }
    });

    return NextResponse.json({ error: "Sorry, we couldn't record your request. Please try again." }, { status: 500 });
  }

  // TODO: Add email provider integration and notify info@arysconsultants.com.
  console.log("MomentumOS beta access request saved", {
    workEmail,
    company: insertPayload.company,
    momentumScore: insertPayload.momentum_score,
    primaryConstraint: insertPayload.primary_constraint,
    createdAt
  });

  return NextResponse.json({
    message: "Thanks. Your request has been received."
  });
}
