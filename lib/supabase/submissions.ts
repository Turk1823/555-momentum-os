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

export async function saveAssessmentSubmission(submission: AssessmentSubmission) {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    };
  }

  const { error } = await supabase.from("momentumos_beta_submissions").insert({
    name: submission.intake.name,
    email: submission.intake.email,
    company: submission.intake.company,
    role: submission.intake.role,
    email_capture: submission.emailCapture,
    total_score: submission.totalScore,
    maturity_level: submission.maturityLevel,
    lowest_category_key: submission.lowestCategory.key,
    lowest_category_name: submission.lowestCategory.name,
    lowest_category_score: submission.lowestCategory.score,
    highest_category_key: submission.highestCategory.key,
    highest_category_name: submission.highestCategory.name,
    highest_category_score: submission.highestCategory.score,
    primary_constraint: submission.primaryConstraint,
    category_scores: submission.categoryScores,
    question_scores: submission.scores,
    executive_summary: submission.executiveSummary,
    submitted_at: new Date().toISOString()
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Assessment saved to Supabase." };
}
