import type { Category, CategoryKey, DiagnosticQuestion, PlannerTask } from "@/lib/types";

export const categories: Category[] = [
  {
    key: "strategy",
    name: "Ecosystem Strategy",
    shortName: "Strategy",
    description: "Leadership alignment, revenue accountability, and GTM integration."
  },
  {
    key: "activation",
    name: "Partner Activation",
    shortName: "Activation",
    description: "Partner depth, first-deal support, operating cadence, and measured outcomes."
  },
  {
    key: "cosell",
    name: "Co-Sell Operations",
    shortName: "Co-Sell",
    description: "Shared pipeline workflows, buyer-facing positioning, and sales alignment."
  },
  {
    key: "economics",
    name: "Ecosystem Economics",
    shortName: "Economics",
    description: "Attribution, partner ROI, resource allocation, and quality over volume."
  },
  {
    key: "velocity",
    name: "Ecosystem Velocity",
    shortName: "Velocity",
    description: "Repeatability, proof loops, referrals, and compounding partner momentum."
  }
];

export const questions: DiagnosticQuestion[] = [
  { id: 1, category: "strategy", question: "Is your ecosystem strategy directly accountable for measurable revenue outcomes?" },
  { id: 2, category: "strategy", question: "Is ecosystem-generated revenue measured at leadership level?" },
  { id: 3, category: "strategy", question: "Are ecosystem activities integrated into GTM execution?" },
  { id: 4, category: "strategy", question: "Does leadership understand ecosystem economics?" },
  { id: 5, category: "activation", question: "What percentage of partners actively influence pipeline?" },
  { id: 6, category: "activation", question: "How quickly do partners reach first revenue contribution?" },
  { id: 7, category: "activation", question: "Is partner activation operationalised?" },
  { id: 8, category: "activation", question: "Are activation outcomes measured consistently?" },
  { id: 9, category: "cosell", question: "Are sales and ecosystem teams operationally aligned?" },
  { id: 10, category: "cosell", question: "Are co-sell opportunities operationally tracked?" },
  { id: 11, category: "cosell", question: "Do partners have buyer-facing positioning?" },
  { id: 12, category: "cosell", question: "Are ecosystem opportunities accelerated through co-sell workflows?" },
  { id: 13, category: "economics", question: "Can you measure ecosystem-influenced revenue?" },
  { id: 14, category: "economics", question: "Do you understand which partners generate the highest ROI?" },
  { id: 15, category: "economics", question: "Is ecosystem quality prioritised over partner volume?" },
  { id: 16, category: "economics", question: "Are ecosystem resources allocated strategically?" },
  { id: 17, category: "velocity", question: "Is ecosystem-generated pipeline repeatable?" },
  { id: 18, category: "velocity", question: "Do ecosystem wins compound into future opportunities?" },
  { id: 19, category: "velocity", question: "Is ecosystem velocity improving over time?" },
  { id: 20, category: "velocity", question: "Does your ecosystem operate as a revenue engine?" }
];

export const scoreLabels = {
  1: "Reactive / Non-operational",
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
