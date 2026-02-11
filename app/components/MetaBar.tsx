'use client';

interface MetaBarProps {
  cost: string;
  mode: string;
  promptVersion?: string;
}

export default function MetaBar({ cost, mode, promptVersion = '2.0' }: MetaBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-3 text-xs font-mono text-text-muted">
      <span>Cost: {cost}</span>
      <span className="text-border-secondary">•</span>
      <span>Prompt v{promptVersion}</span>
      <span className="text-border-secondary">•</span>
      <span className="capitalize">{mode}</span>
    </div>
  );
}
