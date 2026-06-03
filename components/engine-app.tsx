"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ClipboardCopy,
  Download,
  Gauge,
  Lightbulb,
  Mail,
  Rocket,
  Target,
  Users
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, constraints, defaultPlannerTasks, questions, scoreLabels } from "@/lib/content";
import { getCategoryScores, getExecutiveSummary, getExtremes, getMaturityLevel, getRecommendations, getTotalScore } from "@/lib/scoring";
import { saveAssessmentSubmission } from "@/lib/supabase/submissions";
import type { AppState, CoSellEntry, RevenueMetrics, StrategySnapshot, UserIntake } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const defaultScores = Object.fromEntries(questions.map((question) => [question.id, 3]));

const defaultStrategy: StrategySnapshot = {
  customerSegment: "Mid-market SaaS and AI buyers",
  market: "UK, EMEA expansion",
  partnerProfiles: "Cloud consultancies, SIs, MSPs, and AI implementation partners",
  objectives: "Create sourced pipeline, accelerate enterprise deals, build repeatable proof",
  revenueContribution: "25% of new pipeline within 12 months",
  timeToRevenue: "45 days",
  ecosystemRisk: "Partner activation stalls after recruitment",
  narrative: "We win by helping partners turn market insight and trusted customer access into measurable revenue momentum."
};

const defaultMetrics: RevenueMetrics = {
  partnerSourcedPipeline: 450000,
  partnerInfluencedPipeline: 720000,
  partnerSourcedRevenue: 120000,
  partnerInfluencedRevenue: 210000,
  activePartners: 24,
  activatedPartners: 9,
  timeToFirstRevenue: 45,
  cosellConversionRate: 28,
  averagePartnerDealSize: 42000,
  repeatDealRate: 34
};

const initialState: AppState = {
  intake: {
    name: "",
    email: "",
    company: "",
    role: ""
  },
  intakeComplete: false,
  scores: defaultScores,
  primaryConstraint: "Activation Bottleneck",
  email: "",
  strategy: defaultStrategy,
  plannerTasks: defaultPlannerTasks,
  coSellEntries: [
    {
      id: "sample-1",
      partnerName: "Northstar Cloud",
      partnerType: "SI",
      jointIcp: "Series B-C SaaS operators",
      valueProp: "Compress onboarding time with implementation-led revenue architecture",
      targetAccounts: "Acme AI, RelayOps, SignalWorks",
      warmIntros: "2",
      salesOwner: "Maya",
      partnerOwner: "Alex",
      nextAction: "Joint discovery call",
      dealStage: "Qualified",
      expectedRevenue: 65000
    }
  ],
  revenueMetrics: defaultMetrics
};

const modules = [
  { id: "diagnostic", label: "Diagnostic", icon: Gauge },
  { id: "strategy", label: "Strategy Builder", icon: Target },
  { id: "planner", label: "Partner Activation Planner", icon: Rocket },
  { id: "cosell", label: "Co-Sell Motion Builder", icon: Users },
  { id: "tracker", label: "Revenue Engine Tracker", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: BriefcaseBusiness }
] as const;

type ModuleId = (typeof modules)[number]["id"];

function getRevenueOpportunity(totalScore: number, lowest: ReturnType<typeof getExtremes>["lowest"]) {
  if (totalScore <= 40) {
    return {
      range: "\u00a3500k - \u00a32.5M annually",
      assumption: "Low maturity profile: resolving core strategy, activation, and co-sell gaps could unlock a larger improvement range.",
      reason: `${lowest.name} is the lowest-scoring category at ${lowest.score}/20, suggesting revenue is being constrained by foundational ecosystem operating gaps.`
    };
  }

  if (totalScore <= 80) {
    return {
      range: "\u00a3250k - \u00a31.2M annually",
      assumption: "Medium maturity profile: improving the weakest category and making partner-led motions more repeatable could unlock a moderate improvement range.",
      reason: `${lowest.name} is the main bottleneck at ${lowest.score}/20, so the opportunity likely sits in better execution consistency, attribution, and partner activation.`
    };
  }

  return {
    range: "\u00a3100k - \u00a3500k annually",
    assumption: "High maturity profile: the opportunity is more optimisation-focused, driven by marginal gains in velocity, partner productivity, and repeatability.",
    reason: `${lowest.name} remains the relative constraint at ${lowest.score}/20, indicating room to tune the system even if the core revenue engine is already mature.`
  };
}

function getBenchmarkPositionLabel(totalScore: number) {
  if (totalScore >= 81) return "Ecosystem Operating System";
  if (totalScore >= 61) return "Revenue Ecosystem";
  if (totalScore >= 41) return "Structured Ecosystem";
  if (totalScore >= 21) return "Emerging Ecosystem";
  return "Reactive Ecosystem";
}

function getRevenueVelocityRiskLabel(totalScore: number, lowest: ReturnType<typeof getExtremes>["lowest"]) {
  if (totalScore >= 75 && lowest.score >= 14) return "Low";
  if (totalScore >= 55 && lowest.score >= 10) return "Medium";
  return "High";
}

function cleanActionPlanText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*]\s*/gm, "")
    .trim();
}

function getActionPlanSection(actionPlan: string, title: string) {
  const sectionTitles = ["Executive Summary", "Top 3 Priority Actions", "Full Action Plan", "Book a Review CTA"];
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const startMatch = actionPlan.match(new RegExp(`(?:^|\\n)\\s*(?:#+\\s*)?(?:\\d+\\.\\s*)?${escapedTitle}\\s*:?(?:\\n|$)`, "i"));

  if (!startMatch || startMatch.index === undefined) return "";

  const start = startMatch.index + startMatch[0].length;
  const nextHeadingPattern = sectionTitles
    .filter((sectionTitle) => sectionTitle !== title)
    .map((sectionTitle) => sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const nextMatch = actionPlan.slice(start).match(new RegExp(`\\n\\s*(?:#+\\s*)?(?:\\d+\\.\\s*)?(?:${nextHeadingPattern})\\s*:?`, "i"));
  const end = nextMatch?.index === undefined ? actionPlan.length : start + nextMatch.index;

  return cleanActionPlanText(actionPlan.slice(start, end));
}

function getFieldValue(block: string, label: string, nextLabels: string[]) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNextLabels = nextLabels.map((nextLabel) => nextLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = escapedNextLabels
    ? new RegExp(`${escapedLabel}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${escapedNextLabels})\\s*:?|$)`, "i")
    : new RegExp(`${escapedLabel}\\s*:?\\s*([\\s\\S]*)`, "i");
  const match = block.match(pattern);

  return cleanActionPlanText(match?.[1] || "");
}

function splitPriorityBlocks(section: string) {
  const blocks: string[] = [];
  const matches = [...section.matchAll(/(?:^|\n)\s*(?=(?:Priority\s*)?(?:[1-3][.)]|Action\s*[1-3]|Priority Action\s*[1-3])\b)/gi)];

  if (matches.length) {
    matches.forEach((match, index) => {
      const start = match.index ?? 0;
      const end = matches[index + 1]?.index ?? section.length;
      const block = section.slice(start, end).trim();
      if (block) blocks.push(block);
    });
  }

  if (blocks.length) return blocks.slice(0, 3);

  return section
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function parsePriorityActions(section: string) {
  return splitPriorityBlocks(section).map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => cleanActionPlanText(line.replace(/^(?:Priority\s*)?(?:[1-3][.)]|Action\s*[1-3]|Priority Action\s*[1-3])\s*:?\s*/i, "")))
      .filter(Boolean);
    const titleLine = lines.find((line) => !/^(Impact level|Why it matters|Recommended next action)\s*:?/i.test(line)) || `Priority ${index + 1}`;
    const impact = getFieldValue(block, "Impact level", ["Why it matters", "Recommended next action"]) || "High";
    const whyItMatters = getFieldValue(block, "Why it matters", ["Recommended next action"]) || block;
    const nextAction = getFieldValue(block, "Recommended next action", []) || "Prioritise this action in the next operating cycle.";

    return {
      title: titleLine.replace(/^Priority title\s*:\s*/i, ""),
      impact,
      whyItMatters,
      nextAction
    };
  });
}

function getTimelineSection(section: string, label: "30" | "60" | "90") {
  const patterns = {
    "30": "(?:30[- ]?day|days?\\s*1\\s*[-–]\\s*30)",
    "60": "(?:60[- ]?day|days?\\s*31\\s*[-–]\\s*60)",
    "90": "(?:90[- ]?day|days?\\s*61\\s*[-–]\\s*90)"
  };
  const startMatch = section.match(new RegExp(`(?:^|\\n)\\s*(?:#+\\s*)?(?:[-*]\\s*)?${patterns[label]}[^\\n]*\\n?`, "i"));

  if (!startMatch || startMatch.index === undefined) return "";

  const start = startMatch.index + startMatch[0].length;
  const nextMatch = section.slice(start).match(new RegExp(`\\n\\s*(?:#+\\s*)?(?:[-*]\\s*)?(?:${Object.values(patterns).join("|")})[^\\n]*`, "i"));
  const end = nextMatch?.index === undefined ? section.length : start + nextMatch.index;

  return cleanActionPlanText(section.slice(start, end));
}

function parseActionPlan(actionPlan: string) {
  const executiveSummary = getActionPlanSection(actionPlan, "Executive Summary") || cleanActionPlanText(actionPlan);
  const prioritySection = getActionPlanSection(actionPlan, "Top 3 Priority Actions");
  const fullActionPlan = getActionPlanSection(actionPlan, "Full Action Plan");
  const priorityActions = parsePriorityActions(prioritySection);
  const timeline = {
    thirty: getTimelineSection(fullActionPlan, "30"),
    sixty: getTimelineSection(fullActionPlan, "60"),
    ninety: getTimelineSection(fullActionPlan, "90")
  };

  return {
    executiveSummary,
    priorityActions,
    fullActionPlan,
    timeline
  };
}

function TextBlock({ text }: { text: string }) {
  const lines = cleanActionPlanText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-2 text-sm leading-6 text-slate-700">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  );
}

function ActionPlanOutput({ actionPlan }: { actionPlan: string }) {
  const parsed = parseActionPlan(actionPlan);
  const timelineItems = [
    { title: "30-Day Recommendations", text: parsed.timeline.thirty },
    { title: "60-Day Recommendations", text: parsed.timeline.sixty },
    { title: "90-Day Recommendations", text: parsed.timeline.ninety }
  ];
  const hasTimeline = timelineItems.some((item) => item.text);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-teal-100 bg-white p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Executive Summary</p>
        <TextBlock text={parsed.executiveSummary} />
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-semibold text-teal-950">Top 3 Priority Actions</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {parsed.priorityActions.map((priority, index) => (
            <div key={`${priority.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-5 text-navy">{priority.title}</h3>
                <span className="shrink-0 rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{priority.impact}</span>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Why it matters</p>
                  <TextBlock text={priority.whyItMatters} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Recommended next action</p>
                  <TextBlock text={priority.nextAction} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-semibold text-teal-950">Full Action Plan</p>
        {hasTimeline ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {timelineItems.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-navy">{item.title}</h3>
                <TextBlock text={item.text || "No specific recommendation provided for this phase."} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <TextBlock text={parsed.fullActionPlan || actionPlan} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-navy">Need help implementing these recommendations?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Book a MomentumOS Review Session to discuss your results, identify the biggest revenue bottleneck, and prioritise next steps.
            </p>
          </div>
          <a
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            href="https://calendly.com/arysconsultants-info?lid=4e9ezwkqillw&utm_medium=email&utm_source=braze&utm_campaign=EM_Trial_User+Welcome&utm_content=user_url_text"
            target="_blank"
            rel="noreferrer"
          >
            Book a Review <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function EngineApp() {
  const [started, setStarted] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>("diagnostic");
  const [state, setState] = useState<AppState>(initialState);
  const [saveStatus, setSaveStatus] = useState<{ tone: "idle" | "success" | "error"; message: string }>({
    tone: "idle",
    message: ""
  });
  const [actionPlanStatus, setActionPlanStatus] = useState<{ tone: "idle" | "success" | "error"; message: string }>({
    tone: "idle",
    message: ""
  });
  const [actionPlan, setActionPlan] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("555-engine-state");
    if (!stored) return;

    try {
      const parsedState = { ...initialState, ...JSON.parse(stored) } as AppState;
      const hasRequiredIntake = Boolean(
        parsedState.intake?.name?.trim() &&
        parsedState.intake?.email?.trim() &&
        parsedState.intake?.company?.trim() &&
        parsedState.intake?.role?.trim()
      );

      setState({
        ...parsedState,
        intakeComplete: parsedState.intakeComplete && hasRequiredIntake
      });
    } catch {
      window.localStorage.removeItem("555-engine-state");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("555-engine-state", JSON.stringify(state));
  }, [state]);

  const totalScore = getTotalScore(state.scores);
  const categoryScores = getCategoryScores(state.scores);
  const maturityLevel = getMaturityLevel(totalScore);
  const { lowest, highest } = getExtremes(state.scores);
  const executiveSummary = getExecutiveSummary(state.scores, state.primaryConstraint);
  const plannerProgress = Math.round((state.plannerTasks.filter((task) => task.completed).length / state.plannerTasks.length) * 100);

  const updateState = (patch: Partial<AppState>) => setState((current) => ({ ...current, ...patch }));

  const completeIntake = async (intake: UserIntake) => {
    const cleanIntake = {
      name: intake.name.trim(),
      email: intake.email.trim(),
      company: intake.company.trim(),
      role: intake.role.trim()
    };

    updateState({ intake: cleanIntake, intakeComplete: true, email: cleanIntake.email });
    await saveAssessment(cleanIntake);
  };

  const saveAssessment = async (intakeOverride?: UserIntake) => {
    const activeIntake = intakeOverride || state.intake;
    const missingIntakeFields = [
      ["first name", activeIntake.name],
      ["work email", activeIntake.email],
      ["company", activeIntake.company],
      ["role / title", activeIntake.role]
    ]
      .filter(([, value]) => !String(value || "").trim())
      .map(([field]) => field);

    if (missingIntakeFields.length) {
      setSaveStatus({
        tone: "error",
        message: `Please enter your ${missingIntakeFields.join(", ")} before saving your assessment.`
      });
      return;
    }

    setSaveStatus({ tone: "idle", message: "Saving assessment..." });
    setActionPlan("");
    setActionPlanStatus({ tone: "idle", message: "" });
    const result = await saveAssessmentSubmission({
      intake: activeIntake,
      emailCapture: activeIntake.email,
      leadGateCompleted: true,
      leadGateCompletedAt: new Date().toISOString(),
      totalScore,
      maturityLevel,
      lowestCategory: {
        key: lowest.key,
        name: lowest.name,
        score: lowest.score
      },
      highestCategory: {
        key: highest.key,
        name: highest.name,
        score: highest.score
      },
      primaryConstraint: state.primaryConstraint,
      categoryScores: categoryScores.map((category) => ({
        key: category.key,
        name: category.name,
        score: category.score
      })),
      scores: state.scores,
      executiveSummary
    });
    setSaveStatus({ tone: result.ok ? "success" : "error", message: result.message });
  };

  const generateActionPlan = async () => {
    setActionPlanStatus({ tone: "idle", message: "Generating your executive action plan..." });
    setActionPlan("");

    try {
      const response = await fetch("/api/action-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          totalScore,
          maturityLevel,
          categoryScores: categoryScores.map((category) => ({
            name: category.name,
            score: category.score
          })),
          lowestScoringCategory: lowest.name,
          selectedBottleneck: state.primaryConstraint,
          companyContext: {
            company: state.intake.company,
            role: state.intake.role
          }
        })
      });

      const data = (await response.json()) as {
        actionPlan?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error("Could not generate your action plan right now. Please try again shortly.");
      }

      setActionPlan(data.actionPlan || "");
      setActionPlanStatus({ tone: "success", message: "Action plan generated." });
    } catch (error) {
      setActionPlanStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not generate your action plan right now. Please try again shortly."
      });
    }
  };

  const exportPdf = () => {
    // TODO: Replace browser print with server-side PDF generation or jsPDF once brand templates are final.
    window.print();
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(executiveSummary);
  };

  const downloadStrategy = () => {
    const blob = new Blob([JSON.stringify(state.strategy, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ecosystem-strategy-snapshot.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!started) {
    return (
      <main className="min-h-screen bg-white">
        <Landing onStart={() => setStarted(true)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Workspace</p>
            <h1 className="text-2xl font-semibold tracking-normal text-navy">The 5/5/5 Ecosystem Revenue Engine</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.intakeComplete && (
              <>
                <Button variant="secondary" onClick={copySummary}><ClipboardCopy size={16} /> Copy executive summary</Button>
                <Button variant="secondary" onClick={exportPdf}><Download size={16} /> Download report</Button>
                <Button onClick={() => window.open("mailto:info@arysconsultants.com?subject=Book ecosystem review", "_blank")}><Mail size={16} /> Book ecosystem review</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {!state.intakeComplete ? (
        <section className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {!assessmentComplete ? (
            <AssessmentQuestionStep
              scores={state.scores}
              setScores={(scores) => updateState({ scores })}
              totalScore={totalScore}
              onComplete={() => {
                setAssessmentComplete(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <BenchmarkPreviewGate
              highest={highest}
              initialIntake={state.intake}
              lowest={lowest}
              onUnlock={completeIntake}
              saveStatus={saveStatus}
              totalScore={totalScore}
            />
          )}
        </section>
      ) : (
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <MetricPill label="Score" value={`${totalScore}/100`} />
            <MetricPill label="Progress" value={`${plannerProgress}%`} />
          </div>
          <nav className="grid gap-1">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50",
                    activeModule === module.id && "bg-teal-50 text-teal-700"
                  )}
                >
                  <Icon size={17} />
                  {module.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="grid min-w-0 gap-6">
          <ResultsDashboard
            totalScore={totalScore}
            maturityLevel={maturityLevel}
            categoryScores={categoryScores}
            lowest={lowest}
            highest={highest}
            executiveSummary={executiveSummary}
            primaryConstraint={state.primaryConstraint}
            setPrimaryConstraint={(primaryConstraint) => updateState({ primaryConstraint })}
            email={state.email}
            setEmail={(email) => updateState({ email })}
            onSaveAssessment={saveAssessment}
            saveStatus={saveStatus}
            intake={state.intake}
            onGenerateActionPlan={generateActionPlan}
            actionPlanStatus={actionPlanStatus}
            actionPlan={actionPlan}
            onDownloadReport={exportPdf}
          />

          {activeModule === "diagnostic" && <Diagnostic scores={state.scores} setScores={(scores) => updateState({ scores })} />}
          {activeModule === "strategy" && <StrategyBuilder strategy={state.strategy} setStrategy={(strategy) => updateState({ strategy })} downloadStrategy={downloadStrategy} />}
          {activeModule === "planner" && <ActivationPlanner tasks={state.plannerTasks} setTasks={(plannerTasks) => updateState({ plannerTasks })} progress={plannerProgress} />}
          {activeModule === "cosell" && <CoSellBuilder entries={state.coSellEntries} setEntries={(coSellEntries) => updateState({ coSellEntries })} />}
          {activeModule === "tracker" && <RevenueTracker metrics={state.revenueMetrics} setMetrics={(revenueMetrics) => updateState({ revenueMetrics })} />}
          {activeModule === "recommendations" && <Recommendations lowestKey={lowest.key} primaryConstraint={state.primaryConstraint} />}
        </section>
      </div>
      )}
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  const rules = ["Revenue is the ultimate ecosystem KPI", "Activation over enablement", "Depth over breadth", "Proof over promises", "Speed over complexity"];
  const multipliers = ["Position", "Map", "Enable", "Accelerate", "Compound"];
  const flywheel = ["Activate", "Close", "Prove", "Attract", "Repeat"];

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-teal-700">Premium ecosystem diagnostic</p>
            <h1 className="text-balance text-5xl font-semibold tracking-normal text-navy sm:text-6xl">The 5/5/5 Ecosystem Revenue Engine</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">Diagnose ecosystem friction. Activate partners faster. Build repeatable partner-led revenue momentum.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={onStart}>Start Ecosystem Diagnostic <ArrowRight size={18} /></Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById("philosophy")?.scrollIntoView()}>Explore the model</Button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="grid gap-4">
              <DashboardPreview label="Maturity score" value="73/100" />
              <DashboardPreview label="Primary constraint" value="Activation Bottleneck" />
              <DashboardPreview label="45-day progress" value="62%" />
              <div className="rounded-lg bg-slate-50 p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={[20, 34, 38, 52, 61, 73].map((value, month) => ({ month, value }))}>
                    <defs>
                      <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f9f9a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0f9f9a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#0f9f9a" fill="url(#tealFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="philosophy" className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <InfoCard title="Why most ecosystems stall" items={["Partner recruitment is mistaken for revenue momentum.", "Enablement assets pile up without first-deal execution.", "Leadership cannot see attribution, economics, or velocity."]} />
          <InfoCard title="The 5/5/5 philosophy" items={["Five rules govern decisions.", "Five value multipliers turn strategy into pipeline.", "Five flywheel steps compound partner-sourced growth."]} />
          <InfoCard title="What the app operationalises" items={["A 20-question maturity diagnostic.", "A 45-day activation plan.", "Co-sell, revenue, and recommendation workflows."]} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <InfoCard title="The 5 Rules" items={rules} />
          <InfoCard title="The 5 Value Multipliers" items={multipliers} />
          <InfoCard title="The 5-Step Flywheel" items={flywheel} />
        </div>
      </section>
    </>
  );
}

function AssessmentQuestionStep({
  onComplete,
  scores,
  setScores,
  totalScore
}: {
  onComplete: () => void;
  scores: Record<number, number>;
  setScores: (scores: Record<number, number>) => void;
  totalScore: number;
}) {
  return (
    <div className="grid gap-6">
      <Card className="border-teal-100 bg-white">
        <CardHeader>
          <CardTitle>Complete the 555 Momentum Assessment</CardTitle>
          <CardDescription>
            Answer the 20 questions first. Your benchmark preview appears immediately after completion, before any email capture.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Live score</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{totalScore}/100</p>
          </div>
          <Button size="lg" onClick={onComplete}>
            Complete Assessment & View Benchmark Preview <ArrowRight size={18} />
          </Button>
        </CardContent>
      </Card>
      <Diagnostic scores={scores} setScores={setScores} />
    </div>
  );
}

function BenchmarkPreviewGate({
  highest,
  initialIntake,
  lowest,
  onUnlock,
  saveStatus,
  totalScore
}: {
  highest: ReturnType<typeof getExtremes>["highest"];
  initialIntake: UserIntake;
  lowest: ReturnType<typeof getExtremes>["lowest"];
  onUnlock: (intake: UserIntake) => Promise<void>;
  saveStatus: { tone: "idle" | "success" | "error"; message: string };
  totalScore: number;
}) {
  const [intake, setIntake] = useState<UserIntake>(initialIntake);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (key: keyof UserIntake, value: string) => setIntake((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!intake.name.trim() || !intake.email.trim() || !intake.company.trim() || !intake.role.trim()) {
      setError("Please complete all fields to unlock your full report.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    await onUnlock(intake);
    setIsSubmitting(false);
  };
  const previewItems = [
    { label: "Momentum Score", value: `${totalScore}/100`, text: "Your current ecosystem revenue maturity score." },
    { label: "Benchmark Position", value: getBenchmarkPositionLabel(totalScore), text: "Directional maturity band from your 555 score." },
    { label: "Primary Constraint", value: lowest.shortName, text: "The lowest-scoring capability limiting momentum." },
    { label: "Revenue Velocity Risk", value: getRevenueVelocityRiskLabel(totalScore, lowest), text: "A directional signal based on score and bottleneck strength." },
    { label: "Top Strength", value: highest.shortName, text: "The strongest capability in your current ecosystem profile." }
  ];

  return (
    <div className="grid gap-6">
      <Card className="border-teal-100 bg-white">
        <CardHeader>
          <CardTitle>Your Ecosystem Revenue Benchmark Preview</CardTitle>
          <CardDescription>Instant directional insight from your current 555 Momentum Assessment responses.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          {previewItems.map((item) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.label}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-navy">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unlock Your Full Executive Report</CardTitle>
          <CardDescription>Submit your details to reveal the complete benchmark report and save your assessment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-950">Your full report includes:</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-teal-950">
              {[
                "Full benchmark breakdown",
                "90-day action plan",
                "Revenue velocity forecast",
                "Executive recommendations",
                "MomentumOS dashboard preview"
              ].map((item) => (
                <li className="flex gap-2" key={item}><Check className="mt-1 shrink-0" size={16} />{item}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Label>First name<Input value={intake.name} onChange={(event) => update("name", event.target.value)} placeholder="Alex" /></Label>
              <Label>Work email<Input type="email" value={intake.email} onChange={(event) => update("email", event.target.value)} placeholder="alex@company.com" /></Label>
              <Label>Company<Input value={intake.company} onChange={(event) => update("company", event.target.value)} placeholder="Company name" /></Label>
              <Label>Role / title<Input value={intake.role} onChange={(event) => update("role", event.target.value)} placeholder="VP Partnerships" /></Label>
            </div>
            <p className="text-xs leading-5 text-slate-500">We&apos;ll send your results and may follow up with relevant MomentumOS updates. No spam.</p>
            {error && <p className="rounded-md bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
            {saveStatus.message && (
              <p className={cn(
                "whitespace-pre-wrap break-words rounded-md p-3 text-sm font-medium",
                saveStatus.tone === "success" && "bg-teal-50 text-teal-800",
                saveStatus.tone === "error" && "bg-rose-50 text-rose-700",
                saveStatus.tone === "idle" && "bg-slate-50 text-slate-600"
              )}>
                {saveStatus.message}
              </p>
            )}
            <Button size="lg" disabled={isSubmitting} onClick={submit}>
              {isSubmitting ? "Unlocking..." : "Unlock Full Report"} <ArrowRight size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsDashboard(props: {
  totalScore: number;
  maturityLevel: string;
  categoryScores: ReturnType<typeof getCategoryScores>;
  lowest: ReturnType<typeof getExtremes>["lowest"];
  highest: ReturnType<typeof getExtremes>["highest"];
  executiveSummary: string;
  primaryConstraint: string;
  setPrimaryConstraint: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  onSaveAssessment: () => Promise<void>;
  saveStatus: { tone: "idle" | "success" | "error"; message: string };
  intake: UserIntake;
  onGenerateActionPlan: () => Promise<void>;
  actionPlanStatus: { tone: "idle" | "success" | "error"; message: string };
  actionPlan: string;
  onDownloadReport: () => void;
}) {
  const canGenerateActionPlan = props.saveStatus.tone === "success";
  const isGeneratingActionPlan = props.actionPlanStatus.tone === "idle" && Boolean(props.actionPlanStatus.message);
  const revenueOpportunity = getRevenueOpportunity(props.totalScore, props.lowest);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardDescription>Overall maturity</CardDescription><CardTitle className="text-3xl">{props.totalScore}/100</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Maturity level</CardDescription><CardTitle className="text-teal-700">{props.maturityLevel}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Weakest category</CardDescription><CardTitle>{props.lowest.shortName}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Strongest category</CardDescription><CardTitle>{props.highest.shortName}</CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Estimated Revenue Opportunity</CardTitle>
          <CardDescription>This is a directional estimate based on your ecosystem maturity profile, not a financial forecast.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.8fr_1fr_1fr]">
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Opportunity range</p>
            <p className="mt-2 text-2xl font-semibold text-navy">{revenueOpportunity.range}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Key assumption</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{revenueOpportunity.assumption}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reason this opportunity exists</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{revenueOpportunity.reason}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Category Radar</CardTitle>
          <CardDescription>Scores are shown out of 20 for each ecosystem capability.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={props.categoryScores.map((item) => ({ category: item.shortName, score: item.score }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fill: "#334155", fontSize: 12 }} />
              <Radar dataKey="score" stroke="#0f9f9a" fill="#0f9f9a" fillOpacity={0.24} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
          <CardDescription>Capture the diagnostic and route follow-up into a review workflow.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{props.executiveSummary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Label>Primary ecosystem constraint<Select value={props.primaryConstraint} onChange={(event) => props.setPrimaryConstraint(event.target.value)}>{constraints.map((constraint) => <option key={constraint}>{constraint}</option>)}</Select></Label>
            <Label>Email capture<Input type="email" value={props.email} onChange={(event) => props.setEmail(event.target.value)} placeholder="leader@company.com" /></Label>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Required final step</p>
              <p className="text-sm font-semibold text-navy">{props.intake.name || "Beta participant"}</p>
              <p className="text-sm text-slate-600">{props.intake.company} {props.intake.role ? `- ${props.intake.role}` : ""}</p>
              <p className="mt-1 text-sm text-slate-500">Save your assessment to record your score and unlock the AI action plan.</p>
            </div>
            <Button size="lg" onClick={props.onSaveAssessment}>Save assessment to record results</Button>
          </div>
          {props.saveStatus.message && (
            <p className={cn(
              "whitespace-pre-wrap break-words rounded-md p-3 text-sm font-medium",
              props.saveStatus.tone === "success" && "bg-teal-50 text-teal-800",
              props.saveStatus.tone === "error" && "bg-rose-50 text-rose-700",
              props.saveStatus.tone === "idle" && "bg-slate-50 text-slate-600"
            )}>
              {props.saveStatus.message}
            </p>
          )}
          {canGenerateActionPlan && (
            <div className="grid gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-950">Your assessment is saved. Generate the next-step plan from these results.</p>
              <Button className="w-full sm:w-fit" disabled={isGeneratingActionPlan} onClick={props.onGenerateActionPlan}>
                <Lightbulb size={16} /> Generate My Ecosystem Revenue Action Plan
              </Button>
              {props.actionPlanStatus.message && (
                <p className={cn(
                  "whitespace-pre-wrap break-words rounded-md p-3 text-sm font-medium",
                  props.actionPlanStatus.tone === "success" && "bg-white text-teal-800",
                  props.actionPlanStatus.tone === "error" && "bg-rose-50 text-rose-700",
                  props.actionPlanStatus.tone === "idle" && "bg-white text-slate-600"
                )}>
                  {props.actionPlanStatus.message}
                </p>
              )}
              {props.actionPlan && (
                <ActionPlanOutput actionPlan={props.actionPlan} />
              )}
            </div>
          )}
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-navy">Want to continuously track ecosystem revenue performance over time?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Continue from this one-off diagnostic into MomentumOS for ongoing tracking, benchmarking, forecasting, and executive reporting.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={props.onDownloadReport}><Download size={16} /> Download report</Button>
              <Button onClick={() => window.open("https://momentumos-platform.vercel.app", "_blank", "noopener,noreferrer")}>
                <Rocket size={16} /> Explore MomentumOS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Category Heatmap</CardTitle><CardDescription>Use the heatmap to spot maturity gaps and resource allocation priorities.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-separate border-spacing-0 text-sm">
            <thead><tr className="text-left text-slate-500">{["Category", "Score", "Maturity", "Signal"].map((header) => <th className="border-b border-slate-200 p-3" key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {props.categoryScores.map((category) => (
                <tr key={category.key}>
                  <td className="border-b border-slate-100 p-3 font-semibold text-navy">{category.name}</td>
                  <td className="border-b border-slate-100 p-3">{category.score}/20</td>
                  <td className="border-b border-slate-100 p-3">{category.score < 9 ? "Fragile" : category.score < 14 ? "Developing" : category.score < 18 ? "Operational" : "Scalable"}</td>
                  <td className="border-b border-slate-100 p-3"><div className="h-3 rounded-full bg-slate-100"><div className={cn("h-3 rounded-full", category.score < 9 ? "bg-rose-400" : category.score < 14 ? "bg-amber-400" : "bg-teal-600")} style={{ width: `${category.score * 5}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Diagnostic({ scores, setScores }: { scores: Record<number, number>; setScores: (scores: Record<number, number>) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>20-Question Ecosystem Maturity Diagnostic</CardTitle><CardDescription>Score each question from 1 to 5. Results update automatically.</CardDescription></CardHeader>
      <CardContent className="grid gap-6">
        {categories.map((category) => (
          <div key={category.key} className="grid gap-3 rounded-lg border border-slate-200 p-4">
            <div><h3 className="font-semibold text-navy">{category.name}</h3><p className="text-sm text-slate-600">{category.description}</p></div>
            {questions.filter((question) => question.category === category.key).map((question) => (
              <div key={question.id} className="grid gap-2 rounded-md bg-slate-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-medium text-slate-800">{question.id}. {question.question}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-teal-700">{scores[question.id]}/5</span>
                </div>
                <input aria-label={question.question} type="range" min="1" max="5" value={scores[question.id]} onChange={(event) => setScores({ ...scores, [question.id]: Number(event.target.value) })} className="accent-teal-600" />
                <p className="text-xs text-slate-500">{scoreLabels[scores[question.id] as keyof typeof scoreLabels]}</p>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StrategyBuilder({ strategy, setStrategy, downloadStrategy }: { strategy: StrategySnapshot; setStrategy: (strategy: StrategySnapshot) => void; downloadStrategy: () => void }) {
  const update = (key: keyof StrategySnapshot, value: string) => setStrategy({ ...strategy, [key]: value });
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader><CardTitle>Ecosystem Revenue Strategy Builder</CardTitle><CardDescription>Define where the ecosystem will create measurable revenue advantage.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Label>Target customer segment<Input value={strategy.customerSegment} onChange={(e) => update("customerSegment", e.target.value)} /></Label>
          <Label>Target market / region<Input value={strategy.market} onChange={(e) => update("market", e.target.value)} /></Label>
          <Label>Ideal partner profiles<Textarea value={strategy.partnerProfiles} onChange={(e) => update("partnerProfiles", e.target.value)} /></Label>
          <Label>Top 3 ecosystem objectives<Textarea value={strategy.objectives} onChange={(e) => update("objectives", e.target.value)} /></Label>
          <Label>Target revenue contribution<Input value={strategy.revenueContribution} onChange={(e) => update("revenueContribution", e.target.value)} /></Label>
          <Label>Time-to-first-partner-revenue goal<Input value={strategy.timeToRevenue} onChange={(e) => update("timeToRevenue", e.target.value)} /></Label>
          <Label>Top ecosystem risk<Input value={strategy.ecosystemRisk} onChange={(e) => update("ecosystemRisk", e.target.value)} /></Label>
          <Label>Strategic narrative<Textarea value={strategy.narrative} onChange={(e) => update("narrative", e.target.value)} /></Label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ecosystem Strategy Snapshot</CardTitle><CardDescription>A board-ready summary of the strategic direction.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 text-sm">
          {Object.entries(strategy).map(([key, value]) => <div key={key} className="rounded-md bg-slate-50 p-3"><p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{key.replace(/([A-Z])/g, " $1")}</p><p className="leading-6 text-slate-700">{value}</p></div>)}
          <Button variant="secondary" onClick={downloadStrategy}><Download size={16} /> Download strategy snapshot</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivationPlanner({ tasks, setTasks, progress }: { tasks: AppState["plannerTasks"]; setTasks: (tasks: AppState["plannerTasks"]) => void; progress: number }) {
  const phases = [...new Set(tasks.map((task) => task.phase))];
  return (
    <Card>
      <CardHeader><CardTitle>45-Day Partner Activation Planner</CardTitle><CardDescription>Operationalise the five value multipliers and track first-revenue readiness.</CardDescription></CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-center gap-4"><Progress value={progress} /><span className="text-sm font-semibold text-teal-700">{progress}% complete</span></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {phases.map((phase) => (
            <div key={phase} className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-navy">{phase}</h3>
              <div className="grid gap-3">
                {tasks.filter((task) => task.phase === phase).map((task) => (
                  <div key={task.id} className="grid gap-2 rounded-md bg-slate-50 p-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800"><input type="checkbox" checked={task.completed} onChange={(e) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, completed: e.target.checked } : item))} className="h-4 w-4 accent-teal-600" />{task.label}</label>
                    <Input placeholder="Add notes" value={task.notes} onChange={(e) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, notes: e.target.value } : item))} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CoSellBuilder({ entries, setEntries }: { entries: CoSellEntry[]; setEntries: (entries: CoSellEntry[]) => void }) {
  const [draft, setDraft] = useState<CoSellEntry>({ id: "", partnerName: "", partnerType: "SI", jointIcp: "", valueProp: "", targetAccounts: "", warmIntros: "", salesOwner: "", partnerOwner: "", nextAction: "", dealStage: "Discovery", expectedRevenue: 0 });
  const addEntry = () => {
    if (!draft.partnerName.trim()) return;
    setEntries([...entries, { ...draft, id: crypto.randomUUID() }]);
    setDraft({ ...draft, id: "", partnerName: "", targetAccounts: "", nextAction: "", expectedRevenue: 0 });
  };
  return (
    <Card>
      <CardHeader><CardTitle>Co-Sell Motion Builder</CardTitle><CardDescription>Design partner opportunities and keep ownership visible.</CardDescription></CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Partner name" value={draft.partnerName} onChange={(e) => setDraft({ ...draft, partnerName: e.target.value })} />
          <Input placeholder="Partner type" value={draft.partnerType} onChange={(e) => setDraft({ ...draft, partnerType: e.target.value })} />
          <Input placeholder="Joint ICP" value={draft.jointIcp} onChange={(e) => setDraft({ ...draft, jointIcp: e.target.value })} />
          <Input placeholder="Joint value proposition" value={draft.valueProp} onChange={(e) => setDraft({ ...draft, valueProp: e.target.value })} />
          <Input placeholder="Target accounts" value={draft.targetAccounts} onChange={(e) => setDraft({ ...draft, targetAccounts: e.target.value })} />
          <Input placeholder="Warm intro opportunities" value={draft.warmIntros} onChange={(e) => setDraft({ ...draft, warmIntros: e.target.value })} />
          <Input placeholder="Sales owner" value={draft.salesOwner} onChange={(e) => setDraft({ ...draft, salesOwner: e.target.value })} />
          <Input placeholder="Partner owner" value={draft.partnerOwner} onChange={(e) => setDraft({ ...draft, partnerOwner: e.target.value })} />
          <Input placeholder="Next action" value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} />
          <Input placeholder="Deal stage" value={draft.dealStage} onChange={(e) => setDraft({ ...draft, dealStage: e.target.value })} />
          <Input type="number" placeholder="Expected revenue" value={draft.expectedRevenue} onChange={(e) => setDraft({ ...draft, expectedRevenue: Number(e.target.value) })} />
          <Button onClick={addEntry}>Add co-sell motion</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="text-left text-slate-500">{["Partner", "Type", "ICP", "Accounts", "Owners", "Stage", "Next action", "Revenue"].map((h) => <th key={h} className="border-b border-slate-200 p-3">{h}</th>)}</tr></thead>
            <tbody>{entries.map((entry) => <tr key={entry.id}><td className="border-b border-slate-100 p-3 font-semibold">{entry.partnerName}</td><td className="border-b border-slate-100 p-3">{entry.partnerType}</td><td className="border-b border-slate-100 p-3">{entry.jointIcp}</td><td className="border-b border-slate-100 p-3">{entry.targetAccounts}</td><td className="border-b border-slate-100 p-3">{entry.salesOwner} / {entry.partnerOwner}</td><td className="border-b border-slate-100 p-3">{entry.dealStage}</td><td className="border-b border-slate-100 p-3">{entry.nextAction}</td><td className="border-b border-slate-100 p-3">{formatCurrency(entry.expectedRevenue)}</td></tr>)}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueTracker({ metrics, setMetrics }: { metrics: RevenueMetrics; setMetrics: (metrics: RevenueMetrics) => void }) {
  const update = (key: keyof RevenueMetrics, value: number) => setMetrics({ ...metrics, [key]: value });
  const activationRatio = metrics.activePartners ? Math.round((metrics.activatedPartners / metrics.activePartners) * 100) : 0;
  const productivity = metrics.activatedPartners ? Math.round(metrics.partnerSourcedRevenue / metrics.activatedPartners) : 0;
  const chartData = useMemo(() => [0.55, 0.65, 0.72, 0.81, 0.9, 1].map((ratio, index) => ({ month: `M${index + 1}`, revenue: Math.round((metrics.partnerSourcedRevenue + metrics.partnerInfluencedRevenue) * ratio) })), [metrics]);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Sourced pipeline" value={formatCurrency(metrics.partnerSourcedPipeline)} />
        <MetricCard title="Influenced pipeline" value={formatCurrency(metrics.partnerInfluencedPipeline)} />
        <MetricCard title="Activation ratio" value={`${activationRatio}%`} />
        <MetricCard title="Partner productivity" value={formatCurrency(productivity)} />
        <MetricCard title="Revenue contribution" value={formatCurrency(metrics.partnerSourcedRevenue + metrics.partnerInfluencedRevenue)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Revenue Engine Metrics</CardTitle><CardDescription>Prototype state is local. Supabase persistence can be added in lib/supabase/client.ts.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(Object.keys(metrics) as Array<keyof RevenueMetrics>).map((key) => <Label key={key}>{key.replace(/([A-Z])/g, " $1")}<Input type="number" value={metrics[key]} onChange={(e) => update(key, Number(e.target.value))} /></Label>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Trend Placeholder</CardTitle><CardDescription>Designed for Vercel deployment and future database-backed monthly trend records.</CardDescription></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="revenue" stroke="#0f9f9a" fill="#cffafe" /></AreaChart></ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Recommendations({ lowestKey, primaryConstraint }: { lowestKey: ReturnType<typeof getExtremes>["lowest"]["key"]; primaryConstraint: string }) {
  const recs = getRecommendations(lowestKey);
  return (
    <Card>
      <CardHeader><CardTitle>Tailored Recommendations</CardTitle><CardDescription>Recommendations adapt to the lowest-scoring category and selected primary constraint.</CardDescription></CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg bg-teal-50 p-4 text-sm text-teal-900"><strong>Primary constraint:</strong> {primaryConstraint}</div>
        {recs.map((rec) => <div key={rec} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700"><Check className="mt-1 shrink-0 text-teal-700" size={18} />{rec}</div>)}
      </CardContent>
    </Card>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><ul className="grid gap-3 text-sm leading-6 text-slate-600">{items.map((item) => <li className="flex gap-2" key={item}><Check className="mt-1 shrink-0 text-teal-700" size={16} />{item}</li>)}</ul></CardContent></Card>;
}

function DashboardPreview({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4"><span className="text-sm text-slate-500">{label}</span><strong className="text-navy">{value}</strong></div>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-semibold text-navy">{value}</p></div>;
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardDescription>{title}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>;
}
