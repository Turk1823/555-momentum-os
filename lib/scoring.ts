import { categories, questions, recommendationMap } from "@/lib/content";
import type { CategoryKey } from "@/lib/types";

export function getCategoryScores(scores: Record<number, number>) {
  return categories.map((category) => {
    const categoryQuestions = questions.filter((question) => question.category === category.key);
    const score = categoryQuestions.reduce((sum, question) => sum + (scores[question.id] || 1), 0);
    return { ...category, score };
  });
}

export function getTotalScore(scores: Record<number, number>) {
  return questions.reduce((sum, question) => sum + (scores[question.id] || 1), 0);
}

export function getMaturityLevel(score: number) {
  if (score <= 20) return "Reactive Ecosystem";
  if (score <= 40) return "Emerging Ecosystem";
  if (score <= 60) return "Structured Ecosystem";
  if (score <= 80) return "Revenue Ecosystem";
  return "Ecosystem Operating System";
}

export function getExtremes(scores: Record<number, number>) {
  const categoryScores = getCategoryScores(scores);
  const lowest = [...categoryScores].sort((a, b) => a.score - b.score)[0];
  const highest = [...categoryScores].sort((a, b) => b.score - a.score)[0];
  return { lowest, highest };
}

export function getExecutiveSummary(scores: Record<number, number>, primaryConstraint: string) {
  const total = getTotalScore(scores);
  const level = getMaturityLevel(total);
  const { lowest, highest } = getExtremes(scores);
  return `Your ecosystem scores ${total}/100, placing it at the ${level} stage. The strongest area is ${highest.name}, while ${lowest.name} is the primary improvement zone. The current constraint is ${primaryConstraint.toLowerCase()}, so the next move is to focus resources on fewer, higher-fit partner motions that can create measurable revenue proof.`;
}

export function getRecommendations(lowestCategory: CategoryKey) {
  return recommendationMap[lowestCategory];
}
