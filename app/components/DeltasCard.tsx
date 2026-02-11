'use client';

import { Delta } from '@/lib/types';

interface DeltasCardProps {
  deltas: Delta[];
}

export default function DeltasCard({ deltas }: DeltasCardProps) {
  if (!deltas || deltas.length === 0) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-amber p-5">
      {/* Header */}
      <h3 className="text-xs font-semibold text-accent-amber uppercase tracking-wider mb-4">
        Disagreements ({deltas.length})
      </h3>

      {/* Delta List */}
      <div className="space-y-4">
        {deltas.map((delta, index) => (
          <div
            key={index}
            className="bg-bg-elevated rounded-lg p-4 border border-border-primary"
          >
            {/* Topic */}
            <h4 className="font-medium text-text-primary mb-3">{delta.topic}</h4>

            {/* Positions Grid */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              {/* GPT Position */}
              <div
                className={`p-3 rounded-lg ${
                  delta.recommended === 'gpt'
                    ? 'bg-accent-green/10 border border-accent-green/30'
                    : 'bg-bg-tertiary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase">
                    GPT
                  </span>
                  {delta.recommended === 'gpt' && (
                    <span className="text-[10px] font-mono font-semibold text-accent-green bg-accent-green/20 px-1.5 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {delta.gpt_position}
                </p>
              </div>

              {/* Claude Position */}
              <div
                className={`p-3 rounded-lg ${
                  delta.recommended === 'claude'
                    ? 'bg-accent-green/10 border border-accent-green/30'
                    : 'bg-bg-tertiary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase">
                    Claude
                  </span>
                  {delta.recommended === 'claude' && (
                    <span className="text-[10px] font-mono font-semibold text-accent-green bg-accent-green/20 px-1.5 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {delta.claude_position}
                </p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-xs font-semibold text-text-muted uppercase block mb-1">
                Reasoning
              </span>
              <p className="text-sm text-text-secondary italic">{delta.reasoning}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
