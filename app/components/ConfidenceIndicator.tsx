'use client';

import { ConfidenceLevel } from '@/lib/types';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  label?: string;
  compact?: boolean;
  showDot?: boolean;
}

const confidenceConfig = {
  high: {
    color: 'text-accent-green',
    bg: 'bg-accent-green',
    bgLight: 'bg-accent-green/20',
    label: 'HIGH',
  },
  medium: {
    color: 'text-accent-amber',
    bg: 'bg-accent-amber',
    bgLight: 'bg-accent-amber/20',
    label: 'MEDIUM',
  },
  low: {
    color: 'text-accent-red',
    bg: 'bg-accent-red',
    bgLight: 'bg-accent-red/20',
    label: 'LOW',
  },
};

export default function ConfidenceIndicator({
  level,
  label,
  compact = false,
  showDot = true,
}: ConfidenceIndicatorProps) {
  const config = confidenceConfig[level];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${config.color} ${config.bgLight} px-1.5 py-0.5 rounded`}
      >
        {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.bg}`} />}
        {label && <span className="text-text-secondary mr-0.5">{label}:</span>}
        {config.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgLight}`}>
      {showDot && <span className={`w-2.5 h-2.5 rounded-full ${config.bg} animate-pulse`} />}
      <span className={`text-xs font-mono font-bold ${config.color}`}>
        {label && <span className="text-text-secondary mr-1">{label}:</span>}
        {config.label}
      </span>
    </div>
  );
}

interface ConsensusStrengthBarProps {
  strength: number;
}

export function ConsensusStrengthBar({ strength }: ConsensusStrengthBarProps) {
  const clampedStrength = Math.max(0, Math.min(100, strength));

  const getBarColor = () => {
    if (clampedStrength >= 80) return 'bg-accent-green';
    if (clampedStrength >= 50) return 'bg-accent-amber';
    return 'bg-accent-red';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">Consensus Strength</span>
        <span className="font-mono font-bold text-text-primary">{clampedStrength}%</span>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden border border-border-primary">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${clampedStrength}%` }}
        />
      </div>
    </div>
  );
}

interface ModelAgreementProps {
  gptConfidence: ConfidenceLevel;
  claudeConfidence: ConfidenceLevel;
}

export function ModelAgreement({ gptConfidence, claudeConfidence }: ModelAgreementProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="text-text-secondary font-medium">Model Agreement:</span>
      <div className="flex items-center gap-3">
        <ConfidenceIndicator level={gptConfidence} label="GPT" compact />
        <span className="text-text-muted">|</span>
        <ConfidenceIndicator level={claudeConfidence} label="Claude" compact />
      </div>
    </div>
  );
}

interface CalibrationWarningProps {
  warning: string;
}

export function CalibrationWarning({ warning }: CalibrationWarningProps) {
  return (
    <div className="bg-accent-amber/10 border border-accent-amber/50 rounded-lg p-3 flex items-start gap-2">
      <span className="text-accent-amber text-lg">&#9888;</span>
      <div>
        <span className="text-xs font-bold text-accent-amber uppercase block mb-1">
          Calibration Warning
        </span>
        <p className="text-sm text-text-primary">{warning}</p>
      </div>
    </div>
  );
}
