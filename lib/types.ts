export type CategoryKey = "strategy" | "activation" | "cosell" | "economics" | "velocity";

export type DiagnosticQuestion = {
  id: number;
  category: CategoryKey;
  question: string;
};

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

export type AppState = {
  scores: Record<number, number>;
  primaryConstraint: string;
  email: string;
  strategy: StrategySnapshot;
  plannerTasks: PlannerTask[];
  coSellEntries: CoSellEntry[];
  revenueMetrics: RevenueMetrics;
};
