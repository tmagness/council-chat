'use client';

interface MetaBarProps {
  cost: string;
  mode: string;
  sessionCost?: string;
  queryCount?: number;
  promptVersion?: string;
}

export default function MetaBar({
  cost,
  mode,
  sessionCost,
  queryCount,
  promptVersion = '2.0'
}: MetaBarProps) {
  return (
    <div className="bg-bg-elevated rounded-lg border-2 border-border-primary p-4">
      <div className="flex items-center justify-between">
        {/* Query Cost */}
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">This Query</span>
            <span className="text-lg font-mono font-semibold text-accent-blue">{cost}</span>
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
        </div>

        {/* Mode & Version */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">Mode:</span>
            <span className={`font-medium px-2 py-0.5 rounded ${
              mode === 'council'
                ? 'bg-accent-blue/20 text-accent-blue'
                : mode === 'degraded'
                ? 'bg-accent-amber/20 text-accent-amber'
                : 'bg-bg-tertiary text-text-secondary'
            }`}>
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
