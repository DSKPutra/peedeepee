import { Check } from 'lucide-react';
import { DOMAINS } from '@/core/constants/domains';
import { getQuestionsByDomain } from '@/core/constants/questions';
import type { AnswerValue } from '@/types';

interface AssessmentStepperProps {
  currentDomainIndex: number;
  answers: Record<string, AnswerValue>;
  onStepClick?: (index: number) => void;
}

export function AssessmentStepper({ currentDomainIndex, answers, onStepClick }: AssessmentStepperProps) {
  return (
    <nav aria-label="Progress assessment" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-1">
        {DOMAINS.map((domain, idx) => {
          const questions = getQuestionsByDomain(domain.id);
          const answered = questions.filter((q) => answers[q.id] !== undefined).length;
          const complete = answered === questions.length;
          const active = idx === currentDomainIndex;

          return (
            <li key={domain.id} className="flex items-center">
              {idx > 0 && <div className="mx-1 h-px w-5 bg-border sm:w-8" />}
              <button
                onClick={() => onStepClick?.(idx)}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                  onStepClick ? 'cursor-pointer hover:bg-surface' : 'cursor-default'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-all ${
                    complete
                      ? 'border-success bg-success/15 text-success'
                      : active
                        ? 'border-accent bg-accent/10 text-accent animate-pulse-glow'
                        : 'border-border text-text-muted'
                  }`}
                >
                  {complete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span className="hidden flex-col items-start lg:flex">
                  <span
                    className={`text-xs font-medium ${
                      active ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {domain.shortName}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {answered}/{questions.length}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
