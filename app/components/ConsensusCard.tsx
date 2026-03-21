'use client';

import { useState } from 'react';
import { ConfidenceLevel } from '@/lib/types';
import ConfidenceIndicator, {
  ConsensusStrengthBar,
  ModelAgreement,
} from './ConfidenceIndicator';

interface ConsensusCardProps {
  consensus: string;
  confidence: ConfidenceLevel;
  consensusStrength: number;
  gptOverallConfidence: ConfidenceLevel;
  claudeOverallConfidence: ConfidenceLevel;
  confidenceReasoning: string;
  isSupercharged?: boolean;
}

export default function ConsensusCard({
  consensus,
  confidence,
  consensusStrength,
  gptOverallConfidence,
  claudeOverallConfidence,
  confidenceReasoning,
  isSupercharged = false,
}: ConsensusCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className={`rounded-lg border-2 border-l-4 p-3 sm:p-5 shadow-lg ${
      isSupercharged
        ? 'bg-amber-950/20 border-amber-500/50 border-l-amber-500'
        : 'bg-bg-tertiary border-accent-blue/30 border-l-accent-blue'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-border-primary">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
            isSupercharged ? 'text-amber-400' : 'text-accent-blue'
          }`}>
            Consensus
          </h3>
          {isSupercharged && (
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z" />
              </svg>
              Premium
            </span>
          )}
        </div>
        <ConfidenceIndicator level={confidence} />
      </div>

      {/* Content */}
      <p className="text-text-primary leading-relaxed font-mono text-sm mb-4">
        {consensus}
      </p>

      {/* Consensus Strength Bar */}
      <div className="mb-4">
        <ConsensusStrengthBar strength={consensusStrength} />
      </div>

      {/* Model Agreement */}
      <div className="mb-4">
        <ModelAgreement
          gptConfidence={gptOverallConfidence}
          claudeConfidence={claudeOverallConfidence}
        />
      </div>

      {/* Confidence Reasoning (collapsible) */}
      <div className="border-t border-border-secondary pt-3">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <span
            className={`transform transition-transform ${showReasoning ? 'rotate-90' : ''}`}
          >
            &#9654;
          </span>
          <span className="font-medium">Why this confidence level</span>
        </button>
        {showReasoning && (
          <p className="mt-2 text-sm text-text-secondary leading-relaxed pl-4 border-l-2 border-border-secondary">
            {confidenceReasoning}
          </p>
        )}
      </div>
    </div>
  );
}
