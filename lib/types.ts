export type CategoryKey = "strategy" | "activation" | "cosell" | "economics" | "velocity";

export type QuestionOption = {
  label: string;
  score: number;
};

export type DiagnosticResponseType = "agreement" | "anchored" | "binary";

export type DiagnosticQuestion = {
  id: number;
  category: CategoryKey;
  statement: string;
  responseType: DiagnosticResponseType;
  options: QuestionOption[];
};

export type BenchmarkQuestionKey = "partnerRevenueShare" | "annualEcosystemRevenue";

export type BenchmarkQuestion = {
  key: BenchmarkQuestionKey;
  label: string;
  options: string[];
};

export type BenchmarkAnswers = Record<BenchmarkQuestionKey, string>;

export type Category = {
  key: CategoryKey;
  name: string;
  shortName: string;
  description: string;
};

export type StrategySnapshot = {
  customerSegment: string;
  market: string;
  partnerProfiles: string;
  objectives: string;
  revenueContribution: string;
  timeToRevenue: string;
  ecosystemRisk: string;
  narrative: string;
};

export type PlannerTask = {
  id: string;
  phase: string;
  label: string;
  completed: boolean;
  notes: string;
};

export type CoSellEntry = {
  id: string;
  partnerName: string;
  partnerType: string;
  jointIcp: string;
  valueProp: string;
  targetAccounts: string;
  warmIntros: string;
  salesOwner: string;
  partnerOwner: string;
  nextAction: string;
  dealStage: string;
  expectedRevenue: number;
};

export type RevenueMetrics = {
  partnerSourcedPipeline: number;
  partnerInfluencedPipeline: number;
  partnerSourcedRevenue: number;
  partnerInfluencedRevenue: number;
  activePartners: number;
  activatedPartners: number;
  timeToFirstRevenue: number;
  cosellConversionRate: number;
  averagePartnerDealSize: number;
  repeatDealRate: number;
};

export type UserIntake = {
  name: string;
  email: string;
  company: string;
  role: string;
};

export type AppState = {
  intake: UserIntake;
  intakeComplete: boolean;
  assessmentId?: string;
  scores: Record<number, number | null>;
  benchmarkAnswers: BenchmarkAnswers;
  primaryConstraint: string;
  email: string;
  strategy: StrategySnapshot;
  plannerTasks: PlannerTask[];
  coSellEntries: CoSellEntry[];
  revenueMetrics: RevenueMetrics;
};
