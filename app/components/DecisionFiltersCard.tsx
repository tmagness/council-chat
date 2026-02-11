'use client';

import { useState } from 'react';

interface DecisionFiltersCardProps {
  notes: string;
}

export default function DecisionFiltersCard({ notes }: DecisionFiltersCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!notes) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
      {/* Header (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-elevated transition-colors"
      >
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Decision Filters
        </h3>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content (collapsible) */}
      <div
        className={`transition-expand overflow-hidden ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-4 pt-1">
          <p className="text-sm text-text-secondary leading-relaxed">{notes}</p>
        </div>
      </div>
    </div>
  );
}
