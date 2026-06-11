import { ArrowRight, GraduationCap, Landmark, Network, ShieldCheck, Siren, UserCheck } from 'lucide-react';
import type { Domain } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getQuestionsByDomain } from '@/core/constants/questions';

const ICONS = { Landmark, UserCheck, ShieldCheck, Network, Siren, GraduationCap } as const;

interface DomainIntroCardProps {
  domain: Domain;
  domainNumber: number;
  totalDomains: number;
  onStart: () => void;
}

const weightVariant = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info' } as const;

export function DomainIntroCard({ domain, domainNumber, totalDomains, onStart }: DomainIntroCardProps) {
  const Icon = ICONS[domain.icon as keyof typeof ICONS] ?? ShieldCheck;
  const questionCount = getQuestionsByDomain(domain.id).length;

  return (
    <Card accentTop className="animate-fade-in text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
        <Icon className="h-8 w-8 text-accent" />
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-text-muted">
        Domain {domainNumber} dari {totalDomains}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">{domain.name}</h2>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="accent">{domain.pasalRange}</Badge>
        <Badge variant={weightVariant[domain.weightLabel]}>
          Bobot {domain.weightLabel} ×{domain.weight.toFixed(1)}
        </Badge>
        <Badge variant="muted">{questionCount} pertanyaan</Badge>
      </div>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-muted">{domain.description}</p>
      <Button size="lg" className="mt-6" onClick={onStart}>
        Mulai Domain Ini
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}
