import type { AnswerValue, Gap, Question, RiskLevel } from '@/types';
import { DOMAIN_WEIGHTS } from '@/core/constants/domains';

/**
 * Klasifikasi risk level dari compliance index (0-100).
 *
 * 0-39%   → KRITIS   — Risiko sanksi pidana/denda signifikan
 * 40-59%  → TINGGI   — Perlu remediation plan segera
 * 60-79%  → SEDANG   — Gap signifikan, perlu perbaikan terstruktur
 * 80-89%  → RENDAH   — Minor gaps, monitoring rutin cukup
 * 90-100% → PATUH    — Postur kepatuhan baik
 */
export function classifyRiskLevel(index: number): RiskLevel {
  if (index < 40) return 'CRITICAL';
  if (index < 60) return 'HIGH';
  if (index < 80) return 'MEDIUM';
  if (index < 90) return 'LOW';
  return 'COMPLIANT';
}

/**
 * Klasifikasi dampak risiko sebuah temuan (gap) individual.
 * Mempertimbangkan: jawaban aktual, bobot pertanyaan, dan bobot domain.
 */
export function classifyGapImpact(question: Question, answer: AnswerValue): RiskLevel {
  const gapScore = 3 - answer; // 1..3
  const domainWeight = DOMAIN_WEIGHTS[question.domainId]; // 1.0..2.0
  // Skor dampak: gap × bobot pertanyaan × bobot domain → rentang 1..18
  const impact = gapScore * question.weight * domainWeight;

  if (impact >= 12) return 'CRITICAL';
  if (impact >= 7.5) return 'HIGH';
  if (impact >= 4) return 'MEDIUM';
  return 'LOW';
}

/** Prioritas remediasi 1 (tertinggi) .. 3 (terendah) dari risk impact. */
export function impactToPriority(impact: RiskLevel): 1 | 2 | 3 {
  if (impact === 'CRITICAL') return 1;
  if (impact === 'HIGH') return 2;
  return 3;
}

/** Skor numerik untuk pengurutan gap (semakin besar semakin prioritas). */
export function gapSortScore(gap: Gap): number {
  return gap.gapScore * DOMAIN_WEIGHTS[gap.domainId] * (4 - gap.priority);
}
