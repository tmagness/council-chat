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
}

export default function ConsensusCard({
  consensus,
  confidence,
  consensusStrength,
  gptOverallConfidence,
  claudeOverallConfidence,
  confidenceReasoning,
}: ConsensusCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-blue border-2 border-l-4 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border-primary">
        <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider">
          Consensus
        </h3>
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
