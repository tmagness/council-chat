'use client';

import { Delta } from '@/lib/types';
import ConfidenceIndicator, { CalibrationWarning } from './ConfidenceIndicator';

interface DeltasCardProps {
  deltas: Delta[];
}

export default function DeltasCard({ deltas }: DeltasCardProps) {
  if (!deltas || deltas.length === 0) return null;

  // Check if any delta has a calibration warning
  const hasCalibrationWarnings = deltas.some((d) => d.calibration_warning);

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-amber border-2 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border-primary">
        <h3 className="text-sm font-bold text-accent-amber uppercase tracking-wider">
          Disagreements
        </h3>
        <span className="text-xs font-mono font-bold text-accent-amber bg-accent-amber/20 px-3 py-1 rounded-full">
          {deltas.length}
        </span>
      </div>

      {/* Top-level calibration warning if any deltas have warnings */}
      {hasCalibrationWarnings && (
        <div className="mb-4">
          <CalibrationWarning warning="Both models express high confidence but disagree on one or more points - consider seeking additional input" />
        </div>
      )}

      {/* Delta List */}
      <div className="space-y-4">
        {deltas.map((delta, index) => (
          <div
            key={index}
            className="bg-bg-elevated rounded-lg p-4 border-2 border-border-primary"
          >
            {/* Topic */}
            <h4 className="font-semibold text-text-primary mb-4 pb-2 border-b border-border-secondary">
              {delta.topic}
            </h4>

            {/* Delta-specific calibration warning */}
            {delta.calibration_warning && (
              <div className="mb-4">
                <CalibrationWarning warning={delta.calibration_warning} />
              </div>
            )}

            {/* Positions Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* GPT Position */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  delta.recommended === 'gpt'
                    ? 'bg-accent-green/10 border-accent-green/50'
                    : 'bg-bg-tertiary border-border-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                    <span className="text-xs font-bold text-text-secondary uppercase">
                      GPT
                    </span>
                    <ConfidenceIndicator
                      level={delta.gpt_confidence}
                      compact
                      showDot={false}
                    />
                  </div>
                  {delta.recommended === 'gpt' && (
                    <span className="text-[10px] font-mono font-bold text-accent-green bg-accent-green/20 px-2 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {delta.gpt_position}
                </p>
              </div>

              {/* Claude Position */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  delta.recommended === 'claude'
                    ? 'bg-accent-green/10 border-accent-green/50'
                    : 'bg-bg-tertiary border-border-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-amber"></div>
                    <span className="text-xs font-bold text-text-secondary uppercase">
                      Claude
                    </span>
                    <ConfidenceIndicator
                      level={delta.claude_confidence}
                      compact
                      showDot={false}
                    />
                  </div>
                  {delta.recommended === 'claude' && (
                    <span className="text-[10px] font-mono font-bold text-accent-green bg-accent-green/20 px-2 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {delta.claude_position}
                </p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-bg-tertiary rounded-lg p-3 border border-border-secondary">
              <span className="text-xs font-bold text-text-muted uppercase block mb-2">
                Reasoning
              </span>
              <p className="text-sm text-text-secondary italic leading-relaxed">
                {delta.reasoning}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
