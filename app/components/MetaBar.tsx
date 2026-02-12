'use client';

interface MetaBarProps {
  cost: string;
  mode: string;
  sessionCost?: string;
  queryCount?: number;
  promptVersion?: string;
  passesUsed?: number;
}

export default function MetaBar({
  cost,
  mode,
  sessionCost,
  queryCount,
  promptVersion = '2.0',
  passesUsed,
}: MetaBarProps) {
  const isSupercharged = mode === 'supercharged';

  return (
    <div className={`rounded-lg border-2 p-4 ${
      isSupercharged
        ? 'bg-amber-950/30 border-amber-500/30'
        : 'bg-bg-elevated border-border-primary'
    }`}>
      <div className="flex items-center justify-between">
        {/* Query Cost */}
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">This Query</span>
            <span className={`text-lg font-mono font-semibold ${isSupercharged ? 'text-amber-400' : 'text-accent-blue'}`}>
              {cost}
            </span>
          </div>

          {sessionCost && (
            <div className="border-l-2 border-border-primary pl-6">
              <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Session Total</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-mono font-semibold text-text-primary">{sessionCost}</span>
                {queryCount && queryCount > 1 && (
                  <span className="text-xs text-text-muted">({queryCount} queries)</span>
                )}
              </div>
            </div>
          )}

          {passesUsed && (
            <div className="border-l-2 border-border-primary pl-6">
              <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Passes</span>
              <span className="text-lg font-mono font-semibold text-amber-400">{passesUsed}</span>
            </div>
          )}
        </div>

        {/* Mode & Version */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">Mode:</span>
            <span className={`font-medium px-2 py-0.5 rounded flex items-center gap-1.5 ${
              isSupercharged
                ? 'bg-amber-500/20 text-amber-400'
                : mode === 'council'
                ? 'bg-accent-blue/20 text-accent-blue'
                : mode === 'degraded'
                ? 'bg-accent-amber/20 text-accent-amber'
                : 'bg-bg-tertiary text-text-secondary'
            }`}>
              {isSupercharged && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z" />
                </svg>
              )}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">Prompt:</span>
            <span className="font-mono text-text-secondary">v{promptVersion}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
