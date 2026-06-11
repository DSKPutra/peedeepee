import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Play, RotateCcw } from 'lucide-react';
import type { AnswerValue } from '@/types';
import { DOMAINS } from '@/core/constants/domains';
import { QUESTIONS, getQuestionsByDomain } from '@/core/constants/questions';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { useOrgStore } from '@/store/orgStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Alert } from '@/components/ui/Alert';
import { AssessmentStepper } from '@/components/assessment/AssessmentStepper';
import { DomainIntroCard } from '@/components/assessment/DomainIntroCard';
import { QuestionCard } from '@/components/assessment/QuestionCard';
import { AssessmentReviewModal } from '@/components/assessment/AssessmentReviewModal';

export default function Assessment() {
  const navigate = useNavigate();
  const { organization, hasPermission } = useOrgStore();
  const {
    assessments,
    activeId,
    currentDomainIndex,
    currentQuestionIndex,
    startAssessment,
    resumeAssessment,
    answerQuestion,
    addEvidence,
    removeEvidence,
    setPosition,
    completeAssessment,
  } = useAssessmentStore();
  const { computeAndStore } = useResultStore();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const active = useMemo(
    () => assessments.find((a) => a.id === activeId && a.status === 'IN_PROGRESS') ?? null,
    [assessments, activeId]
  );
  const inProgress = useMemo(
    () => assessments.filter((a) => a.status === 'IN_PROGRESS'),
    [assessments]
  );

  // ── RBAC guard ──
  if (!hasPermission('start_assessment')) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Lock className="h-12 w-12 text-text-muted" />
        <h1 className="mt-4 font-display text-xl font-bold text-text-primary">Akses dibatasi</h1>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Role <span className="font-mono text-accent">AUDITOR</span> hanya dapat melihat dashboard,
          laporan, dan riwayat. Ubah role di Settings (oleh Administrator) untuk memulai assessment.
        </p>
      </div>
    );
  }

  // ── Layar mulai / lanjutkan ──
  if (!active) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
          PDP Readiness Assessment
        </h1>
        <p className="text-sm leading-relaxed text-text-muted">
          Assessment terdiri dari {QUESTIONS.length} pertanyaan dalam {DOMAINS.length} domain
          kepatuhan UU PDP No. 27 Tahun 2022. Jawaban tersimpan otomatis — Anda dapat melanjutkan
          kapan saja.
        </p>

        {!organization && (
          <Alert variant="warning" title="Profil organisasi belum lengkap">
            Lengkapi profil organisasi di halaman Settings agar laporan menampilkan identitas yang
            benar.
          </Alert>
        )}

        {inProgress.length > 0 && (
          <Card>
            <h2 className="font-display text-base font-semibold text-text-primary">
              Lanjutkan assessment yang berjalan
            </h2>
            <ul className="mt-3 space-y-2">
              {inProgress.map((a) => {
                const answered = Object.keys(a.answers).length;
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/40 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">{a.orgName}</p>
                      <p className="font-mono text-[11px] text-text-muted">
                        Dimulai {new Date(a.createdAt).toLocaleDateString('id-ID')} · {answered}/
                        {QUESTIONS.length} terjawab
                      </p>
                    </div>
                    <Progress value={(answered / QUESTIONS.length) * 100} className="w-28" />
                    <Button size="sm" variant="outline" onClick={() => resumeAssessment(a.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Lanjutkan
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card accentTop>
          <h2 className="font-display text-base font-semibold text-text-primary">
            Mulai assessment baru
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Organisasi: {organization?.name ?? 'Belum diatur'} ·{' '}
            {organization?.industry ?? 'Industri belum diatur'}
          </p>
          <Button
            size="lg"
            className="mt-4"
            onClick={() =>
              startAssessment(organization?.id ?? 'org-unknown', organization?.name ?? 'Organisasi Tanpa Nama')
            }
          >
            <Play className="h-4 w-4" />
            Mulai Assessment Baru
          </Button>
        </Card>
      </div>
    );
  }

  // ── Wizard aktif ──
  const domain = DOMAINS[currentDomainIndex];
  const domainQuestions = getQuestionsByDomain(domain.id);
  const answeredTotal = Object.keys(active.answers).length;
  const isIntro = currentQuestionIndex < 0;
  const question = isIntro ? null : domainQuestions[currentQuestionIndex];

  const goNext = () => {
    setDirection('forward');
    if (isIntro) {
      setPosition(currentDomainIndex, 0);
      return;
    }
    if (currentQuestionIndex < domainQuestions.length - 1) {
      setPosition(currentDomainIndex, currentQuestionIndex + 1);
    } else if (currentDomainIndex < DOMAINS.length - 1) {
      setPosition(currentDomainIndex + 1, -1);
    } else {
      setReviewOpen(true);
    }
  };

  const goBack = () => {
    setDirection('backward');
    if (isIntro) {
      if (currentDomainIndex > 0) {
        const prevQuestions = getQuestionsByDomain(DOMAINS[currentDomainIndex - 1].id);
        setPosition(currentDomainIndex - 1, prevQuestions.length - 1);
      }
      return;
    }
    if (currentQuestionIndex === 0) {
      setPosition(currentDomainIndex, -1);
    } else {
      setPosition(currentDomainIndex, currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // jeda kecil agar loading state terlihat (simulasi komputasi)
      await new Promise((r) => setTimeout(r, 600));
      const completed = { ...active, status: 'COMPLETED' as const, completedAt: new Date().toISOString() };
      computeAndStore(completed);
      completeAssessment(active.id);
      navigate(`/report/${active.id}`);
    } finally {
      setSubmitting(false);
      setReviewOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Stepper + progress global */}
      <AssessmentStepper
        currentDomainIndex={currentDomainIndex}
        answers={active.answers}
        onStepClick={(idx) => {
          setDirection(idx >= currentDomainIndex ? 'forward' : 'backward');
          setPosition(idx, -1);
        }}
      />
      <div>
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-text-muted">
          <span>Progress keseluruhan</span>
          <span>
            {answeredTotal}/{QUESTIONS.length} terjawab · tersimpan otomatis
          </span>
        </div>
        <Progress value={(answeredTotal / QUESTIONS.length) * 100} />
      </div>

      {isIntro ? (
        <DomainIntroCard
          domain={domain}
          domainNumber={currentDomainIndex + 1}
          totalDomains={DOMAINS.length}
          onStart={goNext}
        />
      ) : (
        question && (
          <>
            <QuestionCard
              question={question}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={domainQuestions.length}
              weightLabel={domain.weightLabel}
              answer={active.answers[question.id]}
              evidenceFiles={active.evidenceFiles[question.id] ?? []}
              direction={direction}
              onAnswer={(value: AnswerValue) => answerQuestion(question.id, value)}
              onAddEvidence={(file) => addEvidence(question.id, file)}
              onRemoveEvidence={(file) => removeEvidence(question.id, file)}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentDomainIndex === 0 && isIntro}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <Button onClick={goNext} disabled={active.answers[question.id] === undefined}>
                {currentDomainIndex === DOMAINS.length - 1 &&
                currentQuestionIndex === domainQuestions.length - 1
                  ? 'Review & Submit'
                  : 'Simpan & Lanjut'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )
      )}

      <AssessmentReviewModal
        open={reviewOpen}
        answers={active.answers}
        submitting={submitting}
        onClose={() => setReviewOpen(false)}
        onSubmit={handleSubmit}
        onJumpToDomain={(idx) => setPosition(idx, -1)}
      />
    </div>
  );
}
