import type { BenchmarkQuestion, Category, CategoryKey, DiagnosticQuestion, PlannerTask, QuestionOption } from "@/lib/types";

const agreementOptions: QuestionOption[] = [
  { label: "Strongly Disagree", score: 1 },
  { label: "Disagree", score: 2 },
  { label: "Neutral", score: 3 },
  { label: "Agree", score: 4 },
  { label: "Strongly Agree", score: 5 }
];

export const categories: Category[] = [
  {
    key: "strategy",
    name: "Ecosystem Strategy",
    shortName: "Strategy",
    description: "Leadership alignment, revenue accountability, and GTM integration"
  },
  {
    key: "activation",
    name: "Partner Activation",
    shortName: "Activation",
    description: "Partner depth, first-deal support, operating cadence, and measured outcomes"
  },
  {
    key: "cosell",
    name: "Co-Sell Operations",
    shortName: "Co-Sell",
    description: "Shared pipeline workflows, buyer-facing positioning, and sales alignment"
  },
  {
    key: "economics",
    name: "Ecosystem Economics",
    shortName: "Economics",
    description: "Attribution, partner ROI, resource allocation, and quality over volume"
  },
  {
    key: "velocity",
    name: "Ecosystem Velocity",
    shortName: "Velocity",
    description: "Repeatability, proof loops, referrals, and compounding partner momentum"
  }
];

export const questions: DiagnosticQuestion[] = [
  {
    id: 1,
    category: "strategy",
    statement: "Our ecosystem strategy is clearly defined and understood across the organisation",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 2,
    category: "strategy",
    statement: "Ecosystem revenue goals are owned at leadership level and reviewed regularly",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 3,
    category: "strategy",
    statement: "Ecosystem activity is integrated into mainstream go-to-market execution",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 4,
    category: "strategy",
    statement: "Leaders understand how ecosystem investment should translate into measurable revenue outcomes",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 5,
    category: "activation",
    statement: "What share of recruited partners actively influence pipeline within the first 12 months",
    responseType: "anchored",
    options: [
      { label: "Less than 10%", score: 1 },
      { label: "10-25%", score: 2 },
      { label: "26-40%", score: 3 },
      { label: "41-60%", score: 4 },
      { label: "More than 60%", score: 5 }
    ]
  },
  {
    id: 6,
    category: "activation",
    statement: "How long does it typically take for a newly recruited partner to become revenue-active",
    responseType: "anchored",
    options: [
      { label: "180+ Days or Never", score: 1 },
      { label: "120-180 days", score: 2 },
      { label: "90-120 days", score: 3 },
      { label: "60-90 days", score: 4 },
      { label: "Less than 60 days", score: 5 }
    ]
  },
  {
    id: 7,
    category: "activation",
    statement: "Partner activation is operationalised through named owners, milestones, and operating cadence",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 8,
    category: "activation",
    statement: "Enablement completion and activation outcomes are measured consistently across priority partners",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 9,
    category: "cosell",
    statement: "Sales and ecosystem teams share a clear view of target accounts, pipeline ownership, and next actions",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 10,
    category: "cosell",
    statement: "Do you have a documented co-sell process used across partner opportunities",
    responseType: "binary",
    options: [
      { label: "No", score: 1 },
      { label: "Yes", score: 5 }
    ]
  },
  {
    id: 11,
    category: "cosell",
    statement: "Partners have a clear buyer-facing value proposition that sales teams can use confidently",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 12,
    category: "cosell",
    statement: "Co-sell opportunities move faster because partner workflows are embedded in deal execution",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 13,
    category: "economics",
    statement: "Can you consistently measure partner-influenced revenue today",
    responseType: "binary",
    options: [
      { label: "No", score: 1 },
      { label: "Yes", score: 5 }
    ]
  },
  {
    id: 14,
    category: "economics",
    statement: "We understand which partners and motions generate the strongest economic return",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 15,
    category: "economics",
    statement: "Quality of partner contribution is prioritised over partner volume",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 16,
    category: "economics",
    statement: "Ecosystem resources are allocated according to revenue potential and performance evidence",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 17,
    category: "velocity",
    statement: "Ecosystem-generated pipeline is repeatable across priority segments or partner motions",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 18,
    category: "velocity",
    statement: "Wins are converted into proof loops that create new partner demand and repeat opportunities",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 19,
    category: "velocity",
    statement: "Active partners move through enablement and activation milestones quickly enough to sustain revenue momentum",
    responseType: "agreement",
    options: agreementOptions
  },
  {
    id: 20,
    category: "velocity",
    statement: "The ecosystem now operates as a measurable revenue engine rather than an activity programme",
    responseType: "agreement",
    options: agreementOptions
  }
];

export const benchmarkQuestions: BenchmarkQuestion[] = [
  {
    key: "partnerRevenueShare",
    label: "What percentage of company revenue is influenced by partners today",
    options: ["0%", "<1%", "1-5%", "5-10%", "10-20%", "20-40%", "40%+"]
  },
  {
    key: "annualEcosystemRevenue",
    label: "Approximate annual ecosystem-influenced revenue",
    options: ["£0", "<£10k", "£10k-£50k", "£50k-£250k", "£250k-£1m", "£1m-£10m", "£10m+"]
  }
];

export const scoreLabels = {
  1: "Emerging / Early-stage",
  2: "Emerging",
  3: "Structured",
  4: "Operational",
  5: "Optimised / Scalable"
} as const;

export const constraints = [
  "Partner Recruitment Addiction",
  "Activation Bottleneck",
  "Co-Sell Friction",
  "Revenue Attribution Weakness",
  "Ecosystem Visibility Gap",
  "Ecosystem Complexity Problem",
  "Leadership Alignment Issue",
  "Ecosystem Economics Blindspot"
];

export const recommendationMap: Record<CategoryKey, string[]> = {
  strategy: [
    "Create an executive ecosystem narrative tied to revenue accountability.",
    "Define partner-led GTM objectives and leadership-level scorecards.",
    "Integrate ecosystem activities into sales, marketing, and customer success execution."
  ],
  activation: [
    "Run a 45-day activation sprint for the highest-fit partners.",
    "Build first-deal playbooks with positioning, account maps, and co-sell support.",
    "Prioritise depth over breadth by concentrating resources on revenue-ready partners."
  ],
  cosell: [
    "Establish shared pipeline workflows with clear sales and partner ownership.",
    "Create CRM visibility for co-sell opportunities and partner influence.",
    "Introduce co-sell governance around deal reviews, next actions, and escalation paths."
  ],
  economics: [
    "Create an attribution model for sourced, influenced, and expanded revenue.",
    "Analyse partner ROI and tier partners by economic contribution.",
    "Prioritise ecosystem resources toward the partners and motions with the highest return."
  ],
  velocity: [
    "Turn wins into proof loops through case studies and referral plays.",
    "Build repeatable partner plays that can be reused across segments.",
    "Create a flywheel rhythm for activate, close, prove, attract, and repeat."
  ]
};

export const defaultPlannerTasks: PlannerTask[] = [
  ["position", "Days 1-7: Position", "Joint value proposition"],
  ["position", "Days 1-7: Position", "ICP alignment"],
  ["position", "Days 1-7: Position", "Competitive positioning"],
  ["map", "Days 8-14: Map", "Target account mapping"],
  ["map", "Days 8-14: Map", "Overlap analysis"],
  ["map", "Days 8-14: Map", "First 5 opportunities"],
  ["enable", "Days 15-24: Enable", "Sales plays"],
  ["enable", "Days 15-24: Enable", "Co-sell motions"],
  ["enable", "Days 15-24: Enable", "Objection handling"],
  ["enable", "Days 15-24: Enable", "Pricing guidance"],
  ["accelerate", "Days 25-35: Accelerate", "Executive sponsorship"],
  ["accelerate", "Days 25-35: Accelerate", "POC support"],
  ["accelerate", "Days 25-35: Accelerate", "Active co-sell workflows"],
  ["prove", "Days 36-45: Close & Prove", "First deal closed"],
  ["prove", "Days 36-45: Close & Prove", "Case study initiated"],
  ["prove", "Days 36-45: Close & Prove", "Flywheel activated"]
].map(([id, phase, label], index) => ({
  id: `${id}-${index}`,
  phase,
  label,
  completed: false,
  notes: ""
}));
