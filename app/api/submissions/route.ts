import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { AssessmentSubmission } from "@/lib/supabase/submissions";
import type { CategoryKey } from "@/lib/types";

type MomentumOSSubmissionRow = {
  name: string;
  email: string;
  company: string;
  role: string;
  total_score: number;
  maturity_level: string;
  lowest_scoring_category: string;
  strategy_score: number;
  activation_score: number;
  cosell_score: number;
  economics_score: number;
  velocity_score: number;
  raw_scores: Record<number, number>;
  metadata: {
    submission_id: string;
    submitted_at: string;
    email_capture: string;
    lowest_category_key: CategoryKey;
    lowest_category_name: string;
    lowest_category_score: number;
    highest_category_key: CategoryKey;
    highest_category_name: string;
    highest_category_score: number;
    primary_constraint: string;
    category_scores: AssessmentSubmission["categoryScores"];
    executive_summary: string;
  };
};

function getRequiredFieldError(submission: AssessmentSubmission) {
  const requiredFields = [
    ["name", submission.intake?.name],
    ["email", submission.intake?.email],
    ["company", submission.intake?.company],
    ["role", submission.intake?.role]
  ];

  const missing = requiredFields
    .filter(([, value]) => !String(value || "").trim())
    .map(([field]) => field);

  if (!missing.length) return "";

  return `Please enter your ${missing.join(", ")} before saving your assessment.`;
}

export async function POST(request: Request) {
  const submission = (await request.json()) as AssessmentSubmission;
  const submittedEmail = submission.intake?.email || "";
  const submittedCompany = submission.intake?.company || "";

  console.log("MomentumOS beta submission received", {
    submittedEmail,
    submittedCompany
  });

  const requiredFieldError = getRequiredFieldError(submission);

  if (requiredFieldError) {
    console.warn("Supabase insert skipped - missing required user details", {
      submittedEmail,
      submittedCompany,
      message: requiredFieldError
    });

    return NextResponse.json({ error: requiredFieldError }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase insert failed - missing environment configuration", {
      submittedEmail,
      submittedCompany
    });

    return NextResponse.json(
      {
        error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });

  const categoryScore = (key: CategoryKey) => {
    return submission.categoryScores.find((category) => category.key === key)?.score ?? 0;
  };

  const submissionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();

  const insertPayload: MomentumOSSubmissionRow = {
    name: submission.intake.name.trim(),
    email: submission.intake.email.trim(),
    company: submission.intake.company.trim(),
    role: submission.intake.role.trim(),
    total_score: submission.totalScore,
    maturity_level: submission.maturityLevel,
    lowest_scoring_category: submission.lowestCategory.name,
    strategy_score: categoryScore("strategy"),
    activation_score: categoryScore("activation"),
    cosell_score: categoryScore("cosell"),
    economics_score: categoryScore("economics"),
    velocity_score: categoryScore("velocity"),
    raw_scores: submission.scores,
    metadata: {
      submission_id: submissionId,
      submitted_at: submittedAt,
      email_capture: submission.emailCapture,
      lowest_category_key: submission.lowestCategory.key,
      lowest_category_name: submission.lowestCategory.name,
      lowest_category_score: submission.lowestCategory.score,
      highest_category_key: submission.highestCategory.key,
      highest_category_name: submission.highestCategory.name,
      highest_category_score: submission.highestCategory.score,
      primary_constraint: submission.primaryConstraint,
      category_scores: submission.categoryScores,
      executive_summary: submission.executiveSummary
    }
  };

  const { error } = await supabase.from("momentumos_beta_submissions").insert(insertPayload);

  if (error) {
    console.error("Supabase insert failure", {
      submittedEmail: insertPayload.email,
      submittedCompany: insertPayload.company,
      success: false,
      rowId: null,
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }
    });

    return NextResponse.json(
      {
        error: `Supabase insert failed: ${error.message}`
      },
      { status: 500 }
    );
  }

  console.log("Supabase insert success", {
    submittedEmail: insertPayload.email,
    submittedCompany: insertPayload.company,
    success: true,
    rowId: submissionId
  });

  return NextResponse.json({
    message: "Your assessment has been saved.",
    rowId: submissionId
  });
}
