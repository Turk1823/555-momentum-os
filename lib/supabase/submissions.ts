import { supabase } from "@/lib/supabase/client";
import type { CategoryKey, UserIntake } from "@/lib/types";

export type AssessmentSubmission = {
  intake: UserIntake;
  emailCapture: string;
  totalScore: number;
  maturityLevel: string;
  lowestCategory: {
    key: CategoryKey;
    name: string;
    score: number;
  };
  highestCategory: {
    key: CategoryKey;
    name: string;
    score: number;
  };
  primaryConstraint: string;
  categoryScores: Array<{
    key: CategoryKey;
    name: string;
    score: number;
  }>;
  scores: Record<number, number>;
  executiveSummary: string;
};

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

export async function saveAssessmentSubmission(submission: AssessmentSubmission) {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    };
  }

  const categoryScore = (key: CategoryKey) => {
    return submission.categoryScores.find((category) => category.key === key)?.score ?? 0;
  };

  const submittedAt = new Date().toISOString();

  const insertPayload: MomentumOSSubmissionRow = {
    name: submission.intake.name,
    email: submission.intake.email,
    company: submission.intake.company,
    role: submission.intake.role,
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
    const fullError = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      inserted_columns: Object.keys(insertPayload)
    };

    console.error("Supabase assessment insert failed", fullError);

    return {
      ok: false,
      message: `Supabase insert failed:\n${JSON.stringify(fullError, null, 2)}`
    };
  }

  return { ok: true, message: "Assessment saved to Supabase." };
}
