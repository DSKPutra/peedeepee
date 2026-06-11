import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { AnswerValue } from '@/types';
import { DOMAINS } from '@/core/constants/domains';
import { getQuestionsByDomain } from '@/core/constants/questions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface AssessmentReviewModalProps {
  open: boolean;
  answers: Record<string, AnswerValue>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onJumpToDomain: (domainIndex: number) => void;
}

export function AssessmentReviewModal({
  open,
  answers,
  submitting,
  onClose,
  onSubmit,
  onJumpToDomain,
}: AssessmentReviewModalProps) {
  const totalQuestions = DOMAINS.reduce((acc, d) => acc + getQuestionsByDomain(d.id).length, 0);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review Jawaban Assessment"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-text-muted">
            {answeredCount}/{totalQuestions} pertanyaan terjawab
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Kembali
            </Button>
            <Button variant="success" onClick={onSubmit} disabled={!allAnswered || submitting}>
              {submitting ? 'Menghitung skor…' : 'Submit Final'}
            </Button>
          </div>
        </div>
      }
    >
      {!allAnswered && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Masih ada pertanyaan yang belum dijawab. Lengkapi semua sebelum submit final.
        </div>
      )}
      <div className="space-y-4">
        {DOMAINS.map((domain, idx) => {
          const questions = getQuestionsByDomain(domain.id);
          const answered = questions.filter((q) => answers[q.id] !== undefined);
          const lowScores = questions.filter((q) => (answers[q.id] ?? 0) < 2 && answers[q.id] !== undefined);
          const complete = answered.length === questions.length;

          return (
            <div key={domain.id} className="rounded-md border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {complete ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <h4 className="font-display text-sm font-semibold text-text-primary">{domain.name}</h4>
                <Badge variant="muted">{domain.pasalRange}</Badge>
                <button
                  onClick={() => {
                    onJumpToDomain(idx);
                    onClose();
                  }}
                  className="ml-auto text-xs text-accent hover:underline"
                >
                  Ubah jawaban
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-text-muted">
                <span>
                  Terjawab: {answered.length}/{questions.length}
                </span>
                <span className={lowScores.length > 0 ? 'text-warning' : ''}>
                  Potensi gap (skor &lt; 2): {lowScores.length}
                </span>
                <span>
                  Rata-rata:{' '}
                  {answered.length > 0
                    ? (
                        answered.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0) / answered.length
                      ).toFixed(1)
                    : '—'}
                  /3
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
