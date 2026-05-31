"use client";

import { useState } from "react";

export type CompanyAnalysisPayload = {
  companyName: string;
  averageMomentumScore: number;
  assessmentCount: number;
  latestAssessmentDate: string;
  categoryScores: Array<{
    label: string;
    value: number;
  }>;
  strongestCategory: {
    label: string;
    value: number;
  };
  weakestCategory: {
    label: string;
    value: number;
  };
  leadershipAlignmentScore: number | null;
  alignmentInsight: string;
  benchmarkMetrics: Array<{
    label: string;
    companyScore: number;
    platformAverage: number;
    difference: number;
    status: string;
  }>;
  trendStatus: string;
  trendChange: number | null;
  teamAssessmentSummary: string;
};

export function CompanyAnalysisClient({ payload }: { payload: CompanyAnalysisPayload }) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyseCompany() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/company-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as {
        analysis?: string;
        error?: string;
      };

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Executive analysis unavailable at the moment.");
      }

      setAnalysis(data.analysis);
    } catch {
      setError("Executive analysis unavailable at the moment.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">AI Executive Advisor</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Company briefing for {payload.companyName}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Generate an on-demand executive interpretation of this company&apos;s momentum, alignment, benchmark position,
            trend, and recommended 90-day focus.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isLoading}
          onClick={handleAnalyseCompany}
          type="button"
        >
          {isLoading ? "Analysing Company..." : "Analyse Company"}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="whitespace-pre-line text-sm leading-7 text-slate-800">{analysis}</div>
        </div>
      )}
    </section>
  );
}
