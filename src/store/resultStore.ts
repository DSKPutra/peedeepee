import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Assessment, AssessmentResult } from '@/types';
import { computeResult } from '@/core/utils/scoringEngine';

interface ResultState {
  /** Hasil scoring per assessmentId — simulasi tabel hasil. */
  results: Record<string, AssessmentResult>;
  computeAndStore: (assessment: Assessment) => AssessmentResult;
  getResult: (assessmentId: string) => AssessmentResult | undefined;
  deleteResult: (assessmentId: string) => void;
  importResults: (results: Record<string, AssessmentResult>) => void;
  resetAll: () => void;
}

export const useResultStore = create<ResultState>()(
  persist(
    (set, get) => ({
      results: {},

      computeAndStore: (assessment) => {
        const result = computeResult(assessment);
        set((s) => ({ results: { ...s.results, [assessment.id]: result } }));
        return result;
      },

      getResult: (assessmentId) => get().results[assessmentId],

      deleteResult: (assessmentId) =>
        set((s) => {
          const next = { ...s.results };
          delete next[assessmentId];
          return { results: next };
        }),

      importResults: (results) => set({ results }),

      resetAll: () => set({ results: {} }),
    }),
    { name: 'pdp-result-store' }
  )
);
