import type {
  AnswerValue,
  Assessment,
  AssessmentResult,
  DomainId,
  Gap,
  Recommendation,
  RemediationTimeline,
} from '@/types';
import { DOMAIN_ORDER, DOMAIN_WEIGHTS } from '@/core/constants/domains';
import { QUESTIONS, getQuestion, getQuestionsByDomain } from '@/core/constants/questions';
import {
  GENERIC_RECOMMENDATION,
  RECOMMENDATION_LIBRARY,
} from '@/core/constants/recommendations';
import {
  classifyGapImpact,
  classifyRiskLevel,
  gapSortScore,
  impactToPriority,
} from './riskClassifier';

const MAX_ANSWER = 3;

/**
 * Skor satu domain (0-100):
 * domainScore = (Σ answerValue × questionWeight) / (Σ 3 × questionWeight) × 100
 */
export function calculateDomainScore(
  domainId: DomainId,
  answers: Record<string, AnswerValue>
): number {
  const questions = getQuestionsByDomain(domainId);
  if (questions.length === 0) return 0;

  let sum = 0;
  let max = 0;
  for (const q of questions) {
    const answer = answers[q.id] ?? 0;
    sum += answer * q.weight;
    max += MAX_ANSWER * q.weight;
  }
  return max === 0 ? 0 : (sum / max) * 100;
}

/**
 * Total Compliance Index (0-100):
 * totalIndex = Σ(domainScore × domainWeight) / Σ(100 × domainWeight) × 100
 */
export function calculateTotalIndex(domainScores: Record<DomainId, number>): number {
  let sumWeighted = 0;
  let sumMaxWeighted = 0;
  for (const domainId of DOMAIN_ORDER) {
    const weight = DOMAIN_WEIGHTS[domainId];
    sumWeighted += (domainScores[domainId] ?? 0) * weight;
    sumMaxWeighted += 100 * weight;
  }
  return sumMaxWeighted === 0 ? 0 : (sumWeighted / sumMaxWeighted) * 100;
}

/** Temukan pertanyaan dengan skor < 2 sebagai gap. */
export function identifyGaps(answers: Record<string, AnswerValue>): Gap[] {
  const gaps: Gap[] = [];
  for (const q of QUESTIONS) {
    const answer = answers[q.id] ?? 0;
    if (answer < 2) {
      const impact = classifyGapImpact(q, answer);
      gaps.push({
        questionId: q.id,
        domainId: q.domainId,
        pasalRef: q.pasalRef,
        description: q.question,
        currentScore: answer,
        maxScore: MAX_ANSWER,
        gapScore: MAX_ANSWER - answer,
        riskImpact: impact,
        priority: impactToPriority(impact),
      });
    }
  }
  return gaps;
}

/** Urutkan gap berdasarkan bobot pasal × answer gap (descending). */
export function prioritizeRisks(gaps: Gap[]): Gap[] {
  return [...gaps].sort((a, b) => {
    const diff = gapSortScore(b) - gapSortScore(a);
    if (diff !== 0) return diff;
    const qa = getQuestion(a.questionId)?.weight ?? 1;
    const qb = getQuestion(b.questionId)?.weight ?? 1;
    return qb - qa;
  });
}

/** Map prioritas gap ke fase timeline remediasi. */
function priorityToTimeline(priority: 1 | 2 | 3): RemediationTimeline {
  if (priority === 1) return 'IMMEDIATE';
  if (priority === 2) return 'SHORT_TERM';
  return 'LONG_TERM';
}

/** Map setiap gap ke rekomendasi spesifik dari library. */
export function generateRecommendations(gaps: Gap[]): Recommendation[] {
  return prioritizeRisks(gaps).map((gap) => {
    const template = RECOMMENDATION_LIBRARY[gap.questionId];
    return {
      gapId: gap.questionId,
      action: template?.action ?? GENERIC_RECOMMENDATION.action,
      timeline: priorityToTimeline(gap.priority),
      responsibleParty: template?.responsibleParty ?? GENERIC_RECOMMENDATION.responsibleParty,
      pasalRef: gap.pasalRef,
      estimatedEffort: template?.estimatedEffort ?? GENERIC_RECOMMENDATION.estimatedEffort,
    };
  });
}

/** Pipeline lengkap: jawaban → hasil assessment. */
export function computeResult(assessment: Assessment): AssessmentResult {
  const domainScores = {} as Record<DomainId, number>;
  for (const domainId of DOMAIN_ORDER) {
    domainScores[domainId] = round1(calculateDomainScore(domainId, assessment.answers));
  }

  const totalComplianceIndex = round1(calculateTotalIndex(domainScores));
  const gaps = prioritizeRisks(identifyGaps(assessment.answers));

  return {
    assessmentId: assessment.id,
    totalComplianceIndex,
    riskLevel: classifyRiskLevel(totalComplianceIndex),
    domainScores,
    gaps,
    recommendations: generateRecommendations(gaps),
    generatedAt: new Date().toISOString(),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
