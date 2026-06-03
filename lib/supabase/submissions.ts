import type { CategoryKey, UserIntake } from "@/lib/types";

export type AssessmentSubmission = {
  intake: UserIntake;
  emailCapture: string;
  leadGateCompleted?: boolean;
  leadGateCompletedAt?: string;
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
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(submission)
  });

  const data = (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    return {
      ok: false,
      message: data?.error || data?.message || "Your assessment could not be saved. Please check your details and try again."
    };
  }

  return {
    ok: true,
    message: data?.message || "Your assessment has been saved."
  };
}
