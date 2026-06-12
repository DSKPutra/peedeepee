import { useState } from 'react';
import { ChevronDown, Scale } from 'lucide-react';
import type { Question, AnswerValue } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EvidenceDropzone } from './EvidenceDropzone';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  weightLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  answer: AnswerValue | undefined;
  evidenceFiles: string[];
  direction: 'forward' | 'backward';
  onAnswer: (value: AnswerValue) => void;
  onAddEvidence: (fileName: string) => void;
  onRemoveEvidence: (fileName: string) => void;
}

const weightVariant = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info' } as const;

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  weightLabel,
  answer,
  evidenceFiles,
  direction,
  onAnswer,
  onAddEvidence,
  onRemoveEvidence,
}: QuestionCardProps) {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <Card
      key={question.id}
      accentTop
      className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="accent">{question.pasalRef}</Badge>
        <Badge variant={weightVariant[weightLabel]}>{weightLabel}</Badge>
        {question.evidenceRequired && <Badge variant="muted">Evidence dianjurkan</Badge>}
        <span className="ml-auto font-mono text-xs text-text-muted">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      <h3 className="font-display text-lg font-semibold leading-snug text-text-primary">
        {question.question}
      </h3>

      {/* RadioCard opsi jawaban */}
      <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Pilihan jawaban">
        {question.options.map((option) => {
          const selected = answer === option.value;
          return (
            <button
              key={option.value}
              role="radio"
              aria-checked={selected}
              onClick={() => onAnswer(option.value)}
              className={`group flex items-start gap-3 rounded-md border p-3.5 text-left transition-all duration-150 ${
                selected
                  ? 'border-accent bg-accent/10 shadow-[0_0_16px_rgba(232,172,26,0.12)]'
                  : 'border-border bg-background/40 hover:border-accent/40 hover:bg-surface'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold transition-colors ${
                  selected
                    ? 'border-accent bg-accent text-background'
                    : 'border-border text-text-muted group-hover:border-accent/50'
                }`}
              >
                {option.value}
              </span>
              <span>
                <span className={`block text-sm font-medium ${selected ? 'text-accent' : 'text-text-primary'}`}>
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Collapse Konteks Hukum */}
      <div className="mt-4 rounded-md border border-border/70 bg-background/30">
        <button
          onClick={() => setHintOpen((v) => !v)}
          aria-expanded={hintOpen}
          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <Scale className="h-4 w-4 text-accent" />
          Konteks Hukum
          <ChevronDown
            className={`ml-auto h-4 w-4 transition-transform duration-200 ${hintOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {hintOpen && (
          <p className="border-t border-border/70 px-3.5 py-3 text-xs leading-relaxed text-text-muted animate-fade-in">
            {question.hint}
          </p>
        )}
      </div>

      <EvidenceDropzone files={evidenceFiles} onAdd={onAddEvidence} onRemove={onRemoveEvidence} />
    </Card>
  );
}
