'use client';

import { useState, useEffect, useRef } from 'react';
import { MergeResult } from '@/lib/types';

interface StickyNavProps {
  mergeResult: MergeResult;
  visible: boolean;
  onJumpTo: (section: string) => void;
}

export default function StickyNav({ mergeResult, visible, onJumpTo }: StickyNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!visible) return null;

  const confidenceColors = {
    high: 'bg-accent-green',
    medium: 'bg-accent-amber',
    low: 'bg-accent-red',
  };

  return (
    <div className="sticky top-0 z-20 bg-bg-secondary/95 backdrop-blur-sm border-b-2 border-border-primary shadow-lg animate-slide-down">
      {/* Compact Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Consensus Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-accent-blue uppercase tracking-wider">Consensus</span>
              <span className={`w-2 h-2 rounded-full ${confidenceColors[mergeResult.confidence]}`} />
              <span className="text-xs text-text-muted uppercase">{mergeResult.confidence}</span>
            </div>
            <p className="text-sm text-text-primary truncate">
              {mergeResult.consensus}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {mergeResult.next_steps.length > 0 && (
              <div className="text-center">
                <span className="text-lg font-bold text-accent-green">{mergeResult.next_steps.length}</span>
                <span className="text-xs text-text-muted block">Steps</span>
              </div>
            )}
            {mergeResult.deltas.length > 0 && (
              <div className="text-center">
                <span className="text-lg font-bold text-accent-amber">{mergeResult.deltas.length}</span>
                <span className="text-xs text-text-muted block">Deltas</span>
              </div>
            )}
            {mergeResult.unverified_assumptions.length > 0 && (
              <div className="text-center">
                <span className="text-lg font-bold text-accent-red">{mergeResult.unverified_assumptions.length}</span>
                <span className="text-xs text-text-muted block">Flags</span>
              </div>
            )}
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Quick Jump Navigation */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-text-muted mr-1">Jump to:</span>
          <button
            onClick={() => onJumpTo('consensus')}
            className="px-2 py-1 text-xs font-medium bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30 transition-colors"
          >
            Consensus
          </button>
          {mergeResult.deltas.length > 0 && (
            <button
              onClick={() => onJumpTo('deltas')}
              className="px-2 py-1 text-xs font-medium bg-accent-amber/20 text-accent-amber rounded hover:bg-accent-amber/30 transition-colors"
            >
              Disagreements
            </button>
          )}
          {mergeResult.unverified_assumptions.length > 0 && (
            <button
              onClick={() => onJumpTo('assumptions')}
              className="px-2 py-1 text-xs font-medium bg-accent-red/20 text-accent-red rounded hover:bg-accent-red/30 transition-colors"
            >
              Assumptions
            </button>
          )}
          {mergeResult.next_steps.length > 0 && (
            <button
              onClick={() => onJumpTo('nextsteps')}
              className="px-2 py-1 text-xs font-medium bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30 transition-colors"
            >
              Next Steps
            </button>
          )}
          <button
            onClick={() => onJumpTo('raw')}
            className="px-2 py-1 text-xs font-medium bg-bg-elevated text-text-secondary rounded hover:bg-bg-tertiary transition-colors"
          >
            Raw Responses
          </button>
        </div>
      </div>

      {/* Expanded Next Steps */}
      {isExpanded && mergeResult.next_steps.length > 0 && (
        <div className="px-4 pb-3 border-t border-border-primary pt-3">
          <h4 className="text-xs font-bold text-accent-green uppercase tracking-wider mb-2">Next Steps</h4>
          <ol className="space-y-1">
            {mergeResult.next_steps.slice(0, 3).map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="w-4 h-4 rounded-full bg-accent-green/20 text-accent-green flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  {index + 1}
                </span>
                <span className="truncate">{step}</span>
              </li>
            ))}
            {mergeResult.next_steps.length > 3 && (
              <li className="text-xs text-text-muted ml-6">
                +{mergeResult.next_steps.length - 3} more...
              </li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}
