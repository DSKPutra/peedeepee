import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerValue, Assessment } from '@/types';

interface AssessmentState {
  /** Seluruh assessment (in-progress + completed) — simulasi database. */
  assessments: Assessment[];
  /** ID assessment yang sedang dikerjakan di halaman /assessment. */
  activeId: string | null;
  /** Posisi stepper saat ini (index domain 0-5). */
  currentDomainIndex: number;
  /** Index pertanyaan dalam domain aktif; -1 = layar intro domain. */
  currentQuestionIndex: number;

  startAssessment: (orgId: string, orgName: string) => string;
  resumeAssessment: (id: string) => void;
  answerQuestion: (questionId: string, value: AnswerValue) => void;
  addEvidence: (questionId: string, fileName: string) => void;
  removeEvidence: (questionId: string, fileName: string) => void;
  setPosition: (domainIndex: number, questionIndex: number) => void;
  completeAssessment: (id: string) => void;
  deleteAssessment: (id: string) => void;
  importAssessments: (assessments: Assessment[]) => void;
  resetAll: () => void;
}

function makeId(): string {
  return `asmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      assessments: [],
      activeId: null,
      currentDomainIndex: 0,
      currentQuestionIndex: -1,

      startAssessment: (orgId, orgName) => {
        const id = makeId();
        const assessment: Assessment = {
          id,
          orgId,
          orgName,
          createdAt: new Date().toISOString(),
          completedAt: null,
          status: 'IN_PROGRESS',
          answers: {},
          evidenceFiles: {},
        };
        set((s) => ({
          assessments: [...s.assessments, assessment],
          activeId: id,
          currentDomainIndex: 0,
          currentQuestionIndex: -1,
        }));
        return id;
      },

      resumeAssessment: (id) => set({ activeId: id }),

      answerQuestion: (questionId, value) => {
        const { activeId } = get();
        if (!activeId) return;
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === activeId ? { ...a, answers: { ...a.answers, [questionId]: value } } : a
          ),
        }));
      },

      addEvidence: (questionId, fileName) => {
        const { activeId } = get();
        if (!activeId) return;
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === activeId
              ? {
                  ...a,
                  evidenceFiles: {
                    ...a.evidenceFiles,
                    [questionId]: [...(a.evidenceFiles[questionId] ?? []), fileName],
                  },
                }
              : a
          ),
        }));
      },

      removeEvidence: (questionId, fileName) => {
        const { activeId } = get();
        if (!activeId) return;
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === activeId
              ? {
                  ...a,
                  evidenceFiles: {
                    ...a.evidenceFiles,
                    [questionId]: (a.evidenceFiles[questionId] ?? []).filter((f) => f !== fileName),
                  },
                }
              : a
          ),
        }));
      },

      setPosition: (domainIndex, questionIndex) =>
        set({ currentDomainIndex: domainIndex, currentQuestionIndex: questionIndex }),

      completeAssessment: (id) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === id ? { ...a, status: 'COMPLETED' as const, completedAt: new Date().toISOString() } : a
          ),
          activeId: null,
          currentDomainIndex: 0,
          currentQuestionIndex: -1,
        })),

      deleteAssessment: (id) =>
        set((s) => ({
          assessments: s.assessments.filter((a) => a.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      importAssessments: (assessments) => set({ assessments }),

      resetAll: () =>
        set({ assessments: [], activeId: null, currentDomainIndex: 0, currentQuestionIndex: -1 }),
    }),
    { name: 'pdp-assessment-store' }
  )
);
