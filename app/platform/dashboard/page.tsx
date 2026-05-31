import { createClient } from "@supabase/supabase-js";
import { CompanyAnalysisClient, type CompanyAnalysisPayload } from "./company-analysis-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardProps = {
  searchParams?: Promise<{
    company?: string;
  }>;
};

type SubmissionRow = {
  name?: string | null;
  role?: string | null;
  company?: string | null;
  total_score?: number | null;
  strategy_score?: number | null;
  activation_score?: number | null;
  cosell_score?: number | null;
  economics_score?: number | null;
  velocity_score?: number | null;
  metadata?: { submitted_at?: string } | string | null;
};

type CategoryKey = "strategy" | "activation" | "cosell" | "economics" | "velocity";

type CategoryScore = {
  key: CategoryKey;
  label: string;
  value: number;
};

type AlignmentProfile = {
  available: boolean;
  highestScore: number;
  lowestScore: number;
  scoreGap: number;
  alignmentScore: number;
  insight: string;
  interpretation: string;
  action: string;
};

type CompanyGroup = {
  companyName: string;
  rows: SubmissionRow[];
  assessmentCount: number;
  latestAssessmentDate: string;
  latestAssessmentTimestamp: number;
  averageMomentumScore: number;
  categoryScores: CategoryScore[];
  strongestCategory: CategoryScore;
  weakestCategory: CategoryScore;
  priority: string;
  alignment: AlignmentProfile;
};

type BenchmarkMetric = {
  label: string;
  companyScore: number;
  platformAverage: number;
  difference: number;
  status: "Above benchmark" | "On benchmark" | "Below benchmark";
};

type BenchmarkProfile = {
  metrics: BenchmarkMetric[];
  insight: string;
};

type TrendStatus = "Improving" | "Flat" | "Declining";

type TrendMetric = {
  label: string;
  previousScore: number;
  currentScore: number;
  change: number;
  status: TrendStatus;
};

type MomentumTrendProfile = {
  available: boolean;
  previousPeriodLabel: string;
  currentPeriodLabel: string;
  previousMomentumScore: number;
  currentMomentumScore: number;
  momentumChange: number;
  status: TrendStatus;
  categoryTrends: TrendMetric[];
};

async function getSubmissions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    return [] as SubmissionRow[];
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase
    .schema("public")
    .from("momentumos_beta_submissions")
    .select("*");

  if (error) {
    console.error("MomentumOS platform dashboard Supabase query failed:", error.message);
    return [] as SubmissionRow[];
  }

  return (data || []) as SubmissionRow[];
}

function toNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (!validValues.length) return 0;

  return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
}

function getSubmittedAt(row: SubmissionRow) {
  if (!row.metadata) return "";

  if (typeof row.metadata === "string") {
    try {
      const parsed = JSON.parse(row.metadata) as { submitted_at?: string };
      return parsed.submitted_at || "";
    } catch {
      return "";
    }
  }

  return row.metadata.submitted_at || "";
}

function getTimestamp(value: string) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string) {
  if (!value) return "No date available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getPeriodKey(row: SubmissionRow) {
  const submittedAt = getSubmittedAt(row);

  if (!submittedAt) return "";

  const timestamp = getTimestamp(submittedAt);

  if (!timestamp) return "";

  return new Date(timestamp).toISOString().slice(0, 10);
}

function getPriority(weakestKey: CategoryKey) {
  const priorities: Record<CategoryKey, string> = {
    strategy: "Align leadership around ecosystem revenue accountability, GTM integration, and the strategic narrative.",
    activation: "Run a 45-day partner activation sprint focused on first revenue contribution and depth over breadth.",
    cosell: "Create a shared co-sell operating rhythm with tracked opportunities, sales ownership, and partner-facing plays.",
    economics: "Define attribution, partner ROI, and resource allocation rules so investment follows measurable revenue impact.",
    velocity: "Build proof loops, repeatable plays, and case-study motions that compound partner-led momentum."
  };

  return priorities[weakestKey];
}

function getAlignmentInsight(score: number) {
  if (score >= 80) return "Strong leadership alignment";
  if (score >= 60) return "Moderate alignment";
  if (score >= 40) return "Misalignment risk";
  return "Critical leadership misalignment";
}

function getAlignmentInterpretation(scoreGap: number) {
  if (scoreGap <= 20) {
    return "The leadership view is broadly consistent, which means the company is ready to move from diagnosis into shared execution governance.";
  }

  if (scoreGap <= 40) {
    return "There is a workable shared view, but leaders are seeing meaningful differences in ecosystem maturity and operating readiness.";
  }

  if (scoreGap <= 60) {
    return "The score spread suggests leaders are operating from different assumptions about ecosystem performance, constraints, or ownership.";
  }

  return "The leadership team appears materially misaligned on the current state of the ecosystem revenue engine and should calibrate before scaling execution.";
}

function getAlignmentAction(scoreGap: number) {
  if (scoreGap <= 20) {
    return "Move into execution tracking with shared owners, milestone reviews, and a monthly MomentumOS operating cadence.";
  }

  if (scoreGap <= 40) {
    return "Review category-level differences and agree where Strategy, Activation, Co-sell, Economics, or Velocity need a common baseline.";
  }

  return "Run a leadership calibration session to align on the current ecosystem baseline, the biggest bottlenecks, and the next 90-day priorities.";
}

function buildAlignment(rows: SubmissionRow[]): AlignmentProfile {
  const scores = rows.map((row) => toNumber(row.total_score)).filter((score) => score > 0);

  if (scores.length < 2) {
    return {
      available: false,
      highestScore: 0,
      lowestScore: 0,
      scoreGap: 0,
      alignmentScore: 0,
      insight: "Not enough team data yet",
      interpretation: "Capture at least two completed assessments from the same company to compare leadership views.",
      action: "Invite one or more additional leaders to complete the assessment before interpreting alignment."
    };
  }

  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const scoreGap = highestScore - lowestScore;
  const alignmentScore = Math.max(0, 100 - scoreGap);

  return {
    available: true,
    highestScore,
    lowestScore,
    scoreGap,
    alignmentScore,
    insight: getAlignmentInsight(alignmentScore),
    interpretation: getAlignmentInterpretation(scoreGap),
    action: getAlignmentAction(scoreGap)
  };
}

function buildCompanyGroups(rows: SubmissionRow[]) {
  const groups = rows.reduce<Map<string, SubmissionRow[]>>((map, row) => {
    const companyName = row.company?.trim() || "Unknown Company";
    const currentRows = map.get(companyName) || [];
    map.set(companyName, [...currentRows, row]);
    return map;
  }, new Map<string, SubmissionRow[]>());

  return Array.from(groups.entries())
    .map<CompanyGroup>(([companyName, companyRows]) => {
      const sortedRows = [...companyRows].sort((a, b) => getTimestamp(getSubmittedAt(b)) - getTimestamp(getSubmittedAt(a)));
      const latestAssessmentDate = getSubmittedAt(sortedRows[0]);
      const categoryScores: CategoryScore[] = [
        {
          key: "strategy",
          label: "Strategy",
          value: average(companyRows.map((row) => toNumber(row.strategy_score)))
        },
        {
          key: "activation",
          label: "Activation",
          value: average(companyRows.map((row) => toNumber(row.activation_score)))
        },
        {
          key: "cosell",
          label: "Co-sell",
          value: average(companyRows.map((row) => toNumber(row.cosell_score)))
        },
        {
          key: "economics",
          label: "Economics",
          value: average(companyRows.map((row) => toNumber(row.economics_score)))
        },
        {
          key: "velocity",
          label: "Velocity",
          value: average(companyRows.map((row) => toNumber(row.velocity_score)))
        }
      ];
      const sortedCategories = [...categoryScores].sort((a, b) => b.value - a.value);
      const strongestCategory = sortedCategories[0];
      const weakestCategory = sortedCategories[sortedCategories.length - 1];

      return {
        companyName,
        rows: sortedRows,
        assessmentCount: companyRows.length,
        latestAssessmentDate,
        latestAssessmentTimestamp: getTimestamp(latestAssessmentDate),
        averageMomentumScore: average(companyRows.map((row) => toNumber(row.total_score))),
        categoryScores,
        strongestCategory,
        weakestCategory,
        priority: getPriority(weakestCategory.key),
        alignment: buildAlignment(companyRows)
      };
    })
    .sort((a, b) => b.latestAssessmentTimestamp - a.latestAssessmentTimestamp);
}

function getSelectedCompany(companies: CompanyGroup[], companyName?: string) {
  if (!companies.length) return undefined;

  if (!companyName) return companies[0];

  return companies.find((company) => company.companyName === companyName) || companies[0];
}

function getCategoryValue(company: CompanyGroup, key: CategoryKey) {
  return company.categoryScores.find((category) => category.key === key)?.value || 0;
}

function getBenchmarkStatus(difference: number): BenchmarkMetric["status"] {
  if (difference > 2) return "Above benchmark";
  if (difference < -2) return "Below benchmark";
  return "On benchmark";
}

function getTrendStatus(change: number): TrendStatus {
  if (change > 2) return "Improving";
  if (change < -2) return "Declining";
  return "Flat";
}

function getScoreForCategory(row: SubmissionRow, key: CategoryKey) {
  if (key === "strategy") return toNumber(row.strategy_score);
  if (key === "activation") return toNumber(row.activation_score);
  if (key === "cosell") return toNumber(row.cosell_score);
  if (key === "economics") return toNumber(row.economics_score);
  return toNumber(row.velocity_score);
}

function buildTrend(company: CompanyGroup): MomentumTrendProfile {
  const rowsByPeriod = company.rows.reduce<Map<string, SubmissionRow[]>>((map, row) => {
    const periodKey = getPeriodKey(row);

    if (!periodKey) return map;

    const periodRows = map.get(periodKey) || [];
    map.set(periodKey, [...periodRows, row]);
    return map;
  }, new Map<string, SubmissionRow[]>());

  const periodKeys = Array.from(rowsByPeriod.keys()).sort((a, b) => getTimestamp(b) - getTimestamp(a));

  if (periodKeys.length < 2) {
    return {
      available: false,
      previousPeriodLabel: "",
      currentPeriodLabel: "",
      previousMomentumScore: 0,
      currentMomentumScore: 0,
      momentumChange: 0,
      status: "Flat",
      categoryTrends: []
    };
  }

  const currentPeriodKey = periodKeys[0];
  const previousPeriodKey = periodKeys[1];
  const currentRows = rowsByPeriod.get(currentPeriodKey) || [];
  const previousRows = rowsByPeriod.get(previousPeriodKey) || [];
  const previousMomentumScore = average(previousRows.map((row) => toNumber(row.total_score)));
  const currentMomentumScore = average(currentRows.map((row) => toNumber(row.total_score)));
  const momentumChange = currentMomentumScore - previousMomentumScore;
  const categoryDefinitions: Array<{ key: CategoryKey; label: string }> = [
    { key: "strategy", label: "Strategy" },
    { key: "activation", label: "Activation" },
    { key: "cosell", label: "Co-sell" },
    { key: "economics", label: "Economics" },
    { key: "velocity", label: "Velocity" }
  ];

  return {
    available: true,
    previousPeriodLabel: formatDate(previousPeriodKey),
    currentPeriodLabel: formatDate(currentPeriodKey),
    previousMomentumScore,
    currentMomentumScore,
    momentumChange,
    status: getTrendStatus(momentumChange),
    categoryTrends: categoryDefinitions.map((category) => {
      const previousScore = average(previousRows.map((row) => getScoreForCategory(row, category.key)));
      const currentScore = average(currentRows.map((row) => getScoreForCategory(row, category.key)));
      const change = currentScore - previousScore;

      return {
        label: category.label,
        previousScore,
        currentScore,
        change,
        status: getTrendStatus(change)
      };
    })
  };
}

function buildBenchmark(company: CompanyGroup, rows: SubmissionRow[]): BenchmarkProfile {
  const metricInputs = [
    {
      label: "Momentum Score",
      companyScore: company.averageMomentumScore,
      platformAverage: average(rows.map((row) => toNumber(row.total_score)))
    },
    {
      label: "Strategy Score",
      companyScore: getCategoryValue(company, "strategy"),
      platformAverage: average(rows.map((row) => toNumber(row.strategy_score)))
    },
    {
      label: "Activation Score",
      companyScore: getCategoryValue(company, "activation"),
      platformAverage: average(rows.map((row) => toNumber(row.activation_score)))
    },
    {
      label: "Co-sell Score",
      companyScore: getCategoryValue(company, "cosell"),
      platformAverage: average(rows.map((row) => toNumber(row.cosell_score)))
    },
    {
      label: "Economics Score",
      companyScore: getCategoryValue(company, "economics"),
      platformAverage: average(rows.map((row) => toNumber(row.economics_score)))
    },
    {
      label: "Velocity Score",
      companyScore: getCategoryValue(company, "velocity"),
      platformAverage: average(rows.map((row) => toNumber(row.velocity_score)))
    }
  ];

  const metrics = metricInputs.map<BenchmarkMetric>((metric) => {
    const difference = metric.companyScore - metric.platformAverage;

    return {
      ...metric,
      difference,
      status: getBenchmarkStatus(difference)
    };
  });

  const momentumMetric = metrics[0];
  const insight =
    momentumMetric.companyScore < momentumMetric.platformAverage
      ? "Your ecosystem maturity is currently below the platform benchmark."
      : "Your company is currently outperforming the platform benchmark.";

  return {
    metrics,
    insight
  };
}

function formatDifference(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function buildAnalysisPayload(
  company: CompanyGroup,
  benchmark: BenchmarkProfile,
  trend: MomentumTrendProfile
): CompanyAnalysisPayload {
  return {
    companyName: company.companyName,
    averageMomentumScore: company.averageMomentumScore,
    assessmentCount: company.assessmentCount,
    latestAssessmentDate: formatDate(company.latestAssessmentDate),
    categoryScores: company.categoryScores.map((category) => ({
      label: category.label,
      value: category.value
    })),
    strongestCategory: {
      label: company.strongestCategory.label,
      value: company.strongestCategory.value
    },
    weakestCategory: {
      label: company.weakestCategory.label,
      value: company.weakestCategory.value
    },
    leadershipAlignmentScore: company.alignment.available ? company.alignment.alignmentScore : null,
    alignmentInsight: company.alignment.insight,
    benchmarkMetrics: benchmark.metrics.map((metric) => ({
      label: metric.label,
      companyScore: metric.companyScore,
      platformAverage: metric.platformAverage,
      difference: metric.difference,
      status: metric.status
    })),
    trendStatus: trend.available ? trend.status : "Not enough historical data yet",
    trendChange: trend.available ? trend.momentumChange : null,
    teamAssessmentSummary: `${company.assessmentCount} assessment${company.assessmentCount === 1 ? "" : "s"} submitted. ${company.alignment.interpretation}`
  };
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const params = searchParams ? await searchParams : {};
  const rows = await getSubmissions();
  const companies = buildCompanyGroups(rows);
  const selectedCompany = getSelectedCompany(companies, params.company);
  const totalAssessments = companies.reduce((sum, company) => sum + company.assessmentCount, 0);
  const portfolioAverage = average(companies.map((company) => company.averageMomentumScore));
  const benchmark = selectedCompany ? buildBenchmark(selectedCompany, rows) : null;
  const trend = selectedCompany ? buildTrend(selectedCompany) : null;
  const analysisPayload = selectedCompany && benchmark && trend ? buildAnalysisPayload(selectedCompany, benchmark, trend) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">MomentumOS Platform</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Executive Company Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Company-level visibility into ecosystem maturity, team alignment, benchmarking, and 90-day execution priorities.
              </p>
            </div>
            <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
              <span className="font-semibold">{companies.length}</span> companies monitored
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Companies" value={String(companies.length)} />
          <MetricCard label="Assessments" value={String(totalAssessments)} />
          <MetricCard label="Average Momentum Score" value={`${portfolioAverage}/100`} />
        </section>

        {selectedCompany && <CompanySelector companies={companies} selectedCompanyName={selectedCompany.companyName} />}

        {!companies.length && (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">No company data yet</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">No completed assessments are available.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Once assessment submissions are saved in Supabase, this dashboard will group them by company and show maturity,
              alignment, benchmarking, and team assessment visibility.
            </p>
          </section>
        )}

        {selectedCompany && benchmark && (
          <section className="grid gap-6">
            <CompanyCard company={selectedCompany} featured />
            {trend && <MomentumTrendSection trend={trend} />}
            {analysisPayload && <CompanyAnalysisClient payload={analysisPayload} />}
            <BenchmarkingSection benchmark={benchmark} company={selectedCompany} />
            <LeadershipAlignmentSection company={selectedCompany} />
            <TeamAssessmentsTable company={selectedCompany} />
          </section>
        )}

        <section className="grid gap-5">
          {companies
            .filter((company) => company.companyName !== selectedCompany?.companyName)
            .map((company) => (
              <CompanyCard company={company} key={company.companyName} />
            ))}
        </section>
      </section>
    </main>
  );
}

function CompanySelector({
  companies,
  selectedCompanyName
}: {
  companies: CompanyGroup[];
  selectedCompanyName: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <form action="/platform/dashboard" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-md">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700" htmlFor="company">
            Select Company
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            defaultValue={selectedCompanyName}
            id="company"
            name="company"
          >
            {companies.map((company) => (
              <option key={company.companyName} value={company.companyName}>
                {company.companyName}
              </option>
            ))}
          </select>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          type="submit"
        >
          View Company
        </button>
      </form>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ScoreCard({ category }: { category: CategoryScore }) {
  const percentage = Math.min(Math.max((category.value / 20) * 100, 0), 100);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">{category.label}</p>
        <p className="text-sm font-semibold text-teal-700">{category.value}/20</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-600" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function BenchmarkingSection({ benchmark, company }: { benchmark: BenchmarkProfile; company: CompanyGroup }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Benchmarking Intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{company.companyName}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Company performance compared with the current MomentumOS platform benchmark across all saved assessments.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-slate-500">Top Quartile</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">Coming soon</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
        <p className="text-sm font-semibold text-teal-950">Benchmark Insight</p>
        <p className="mt-1 text-sm leading-6 text-teal-900">{benchmark.insight}</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              {["Metric", "Company Score", "Platform Average", "Difference", "Status"].map((header) => (
                <th className="border-b border-slate-200 p-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benchmark.metrics.map((metric) => (
              <tr className="hover:bg-slate-50" key={metric.label}>
                <td className="border-b border-slate-100 p-3 font-semibold text-slate-950">{metric.label}</td>
                <td className="border-b border-slate-100 p-3 text-slate-700">{metric.companyScore}</td>
                <td className="border-b border-slate-100 p-3 text-slate-700">{metric.platformAverage}</td>
                <td className="border-b border-slate-100 p-3">
                  <span className={metric.difference >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                    {formatDifference(metric.difference)}
                  </span>
                </td>
                <td className="border-b border-slate-100 p-3">
                  <BenchmarkStatusBadge status={metric.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MomentumTrendSection({ trend }: { trend: MomentumTrendProfile }) {
  if (!trend.available) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Momentum Trend</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Not enough historical data yet</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Trend tracking will appear once the selected company has assessments from at least two submitted dates.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Momentum Trend</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest vs Previous Assessment Period</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Comparing {trend.currentPeriodLabel} against {trend.previousPeriodLabel} using submitted assessment timestamps.
          </p>
        </div>
        <TrendStatusBadge status={trend.status} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <CompactMetric label="Previous Average Momentum Score" value={`${trend.previousMomentumScore}/100`} />
        <CompactMetric label="Current Average Momentum Score" value={`${trend.currentMomentumScore}/100`} />
        <CompactMetric label="Score Change" value={formatDifference(trend.momentumChange)} />
        <CompactMetric label="Trend Status" value={trend.status} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              {["Category", "Previous Score", "Current Score", "Change", "Trend Status"].map((header) => (
                <th className="border-b border-slate-200 p-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trend.categoryTrends.map((metric) => (
              <tr className="hover:bg-slate-50" key={metric.label}>
                <td className="border-b border-slate-100 p-3 font-semibold text-slate-950">{metric.label}</td>
                <td className="border-b border-slate-100 p-3 text-slate-700">{metric.previousScore}/20</td>
                <td className="border-b border-slate-100 p-3 text-slate-700">{metric.currentScore}/20</td>
                <td className="border-b border-slate-100 p-3">
                  <span className={metric.change >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                    {formatDifference(metric.change)}
                  </span>
                </td>
                <td className="border-b border-slate-100 p-3">
                  <TrendStatusBadge status={metric.status} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendStatusBadge({ status, compact = false }: { status: TrendStatus; compact?: boolean }) {
  const className =
    status === "Improving"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Declining"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border font-semibold ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"} ${className}`}>
      {status}
    </span>
  );
}

function BenchmarkStatusBadge({ status }: { status: BenchmarkMetric["status"] }) {
  const className =
    status === "Above benchmark"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Below benchmark"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function LeadershipAlignmentSection({ company }: { company: CompanyGroup }) {
  const alignment = company.alignment;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Leadership Alignment Score</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{company.companyName}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Alignment is calculated from the spread between the highest and lowest Momentum Score across this company&apos;s
            completed assessments.
          </p>
          <p className="mt-3 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {alignment.interpretation}
          </p>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-5 py-4 text-left lg:text-right">
          <p className="text-sm font-medium text-teal-800">Alignment Score</p>
          <p className="mt-1 text-3xl font-semibold text-teal-950">
            {alignment.available ? `${alignment.alignmentScore}%` : "Not enough team data yet"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <CompactMetric label="Highest Score" value={alignment.available ? `${alignment.highestScore}/100` : "Not enough data"} />
        <CompactMetric label="Lowest Score" value={alignment.available ? `${alignment.lowestScore}/100` : "Not enough data"} />
        <CompactMetric label="Score Gap" value={alignment.available ? `${alignment.scoreGap} points` : "Not enough data"} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <InsightCard
          eyebrow="Alignment Insight"
          title={alignment.insight}
          text={
            alignment.available
              ? "This reflects how consistently leaders and team members see the current ecosystem revenue engine."
              : "Capture one more assessment from this company to reveal alignment spread."
          }
        />
        <InsightCard eyebrow="Recommended Alignment Action" title="Next leadership move" text={alignment.action} />
      </div>
    </section>
  );
}

function CompanyCard({ company, featured = false }: { company: CompanyGroup; featured?: boolean }) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm sm:p-6 ${featured ? "border-teal-200" : "border-slate-200"}`}>
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            {featured ? "Selected Company Workspace" : "Company Workspace"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{company.companyName}</h2>
          <p className="mt-2 text-sm text-slate-500">Latest Assessment Date: {formatDate(company.latestAssessmentDate)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CompactMetric label="Assessments" value={String(company.assessmentCount)} />
          <CompactMetric label="Momentum" value={`${company.averageMomentumScore}/100`} />
          <CompactMetric label="Alignment" value={company.alignment.available ? `${company.alignment.alignmentScore}%` : "Not enough data"} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {company.categoryScores.map((category) => (
          <ScoreCard category={category} key={category.key} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <InsightCard
          eyebrow="Strongest Category"
          title={`${company.strongestCategory.label} (${company.strongestCategory.value}/20)`}
          text="This is the strongest current operating signal in the company ecosystem profile."
        />
        <InsightCard
          eyebrow="Weakest Category"
          title={`${company.weakestCategory.label} (${company.weakestCategory.value}/20)`}
          text="This is the most likely constraint on partner-led revenue momentum."
        />
        <InsightCard eyebrow="Recommended 90-Day Priority" title={company.weakestCategory.label} text={company.priority} />
      </div>
    </article>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  if (!role?.trim()) {
    return <span className="text-slate-500">Not provided</span>;
  }

  const lowerRole = role.toLowerCase();
  const className =
    lowerRole.includes("chief") || lowerRole.includes("ceo") || lowerRole.includes("founder") || lowerRole.includes("vp")
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : lowerRole.includes("partner") || lowerRole.includes("alliance") || lowerRole.includes("ecosystem")
        ? "border-cyan-200 bg-cyan-50 text-cyan-800"
        : lowerRole.includes("sales") || lowerRole.includes("revenue") || lowerRole.includes("gtm")
          ? "border-indigo-200 bg-indigo-50 text-indigo-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex max-w-[180px] items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <span className="truncate">{role}</span>
    </span>
  );
}

function MomentumScoreCell({ score, alignment }: { score: number; alignment: AlignmentProfile }) {
  const isHighest = alignment.highestScore > 0 && score === alignment.highestScore;
  const isLowest = alignment.lowestScore > 0 && score === alignment.lowestScore;

  if (isHighest) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
        {score}/100 <span className="text-xs font-medium">Highest</span>
      </span>
    );
  }

  if (isLowest) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-800">
        {score}/100 <span className="text-xs font-medium">Lowest</span>
      </span>
    );
  }

  return <span className="font-semibold text-slate-950">{score}/100</span>;
}

function TeamAssessmentsTable({ company }: { company: CompanyGroup }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Team Assessments</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{company.companyName}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Individual assessment visibility for the selected company workspace, sorted by latest assessment first.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              {[
                "Name",
                "Role",
                "Company",
                "Assessment Date",
                "Total Momentum Score",
                "Strategy Score",
                "Activation Score",
                "Co-sell Score",
                "Economics Score",
                "Velocity Score"
              ].map((header) => (
                <th className="border-b border-slate-200 p-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {company.rows.map((row, index) => {
              const submittedAt = getSubmittedAt(row);
              const totalScore = toNumber(row.total_score);

              return (
                <tr className="hover:bg-slate-50" key={`${row.name || "team-member"}-${submittedAt || index}`}>
                  <td className="border-b border-slate-100 p-3 font-semibold text-slate-950">{row.name || "Unknown"}</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">
                    <RoleBadge role={row.role} />
                  </td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{row.company || "Unknown Company"}</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{formatDate(submittedAt)}</td>
                  <td className="border-b border-slate-100 p-3">
                    <MomentumScoreCell alignment={company.alignment} score={totalScore} />
                  </td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{toNumber(row.strategy_score)}/20</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{toNumber(row.activation_score)}/20</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{toNumber(row.cosell_score)}/20</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{toNumber(row.economics_score)}/20</td>
                  <td className="border-b border-slate-100 p-3 text-slate-700">{toNumber(row.velocity_score)}/20</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
