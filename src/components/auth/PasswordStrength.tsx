export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export function evaluatePassword(pw: string): StrengthResult {
  if (!pw) return { score: 0, label: '', color: '#3D4160' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;

  const levels: StrengthResult[] = [
    { score: 0, label: 'Lemah', color: '#EF4444' },
    { score: 1, label: 'Lemah', color: '#EF4444' },
    { score: 2, label: 'Cukup', color: '#F59E0B' },
    { score: 3, label: 'Kuat', color: '#60A5FA' },
    { score: 4, label: 'Sangat Kuat', color: '#22C55E' },
  ];
  return levels[score] as StrengthResult;
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = evaluatePassword(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-200"
            style={{ backgroundColor: i <= score ? color : '#1E2030' }}
          />
        ))}
      </div>
      <p className="mt-1 font-mono text-[11px]" style={{ color }}>
        Kekuatan password: {label}
      </p>
    </div>
  );
}
