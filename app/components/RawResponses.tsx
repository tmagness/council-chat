'use client';

import { useState } from 'react';

interface RawResponsesProps {
  gptResponse: string | null;
  claudeResponse: string | null;
}

export default function RawResponses({
  gptResponse,
  claudeResponse,
}: RawResponsesProps) {
  const [viewMode, setViewMode] = useState<'collapsed' | 'stacked' | 'side-by-side'>('collapsed');

  if (!gptResponse && !claudeResponse) return null;

  const hasBoth = gptResponse && claudeResponse;

  return (
    <div className="bg-bg-tertiary rounded-lg border-2 border-border-primary overflow-hidden">
      {/* Section Header with View Toggle */}
      <div className="px-5 py-3 border-b-2 border-border-primary flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Raw Responses
        </h3>
        {hasBoth && (
          <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-1">
            <button
              onClick={() => setViewMode('collapsed')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'collapsed'
                  ? 'bg-accent-blue text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Collapsed
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'stacked'
                  ? 'bg-accent-blue text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Stacked
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-accent-blue text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Side-by-Side View */}
      {viewMode === 'side-by-side' && hasBoth && (
        <div className="grid grid-cols-2 divide-x-2 divide-border-primary">
          {/* GPT Column */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-accent-green"></div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                GPT-5.2
              </span>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                {gptResponse}
              </pre>
            </div>
          </div>

          {/* Claude Column */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-accent-amber"></div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Claude
              </span>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                {claudeResponse}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Stacked View */}
      {viewMode === 'stacked' && (
        <div className="divide-y-2 divide-border-primary">
          {gptResponse && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  GPT-5.2 Response
                </span>
              </div>
              <div className="overflow-y-auto max-h-[300px]">
                <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                  {gptResponse}
                </pre>
              </div>
            </div>
          )}
          {claudeResponse && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent-amber"></div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Claude Response
                </span>
              </div>
              <div className="overflow-y-auto max-h-[300px]">
                <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                  {claudeResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed View (Expandable Accordions) */}
      {viewMode === 'collapsed' && (
        <CollapsedView gptResponse={gptResponse} claudeResponse={claudeResponse} />
      )}
    </div>
  );
}

function CollapsedView({
  gptResponse,
  claudeResponse,
}: {
  gptResponse: string | null;
  claudeResponse: string | null;
}) {
  const [expandedGpt, setExpandedGpt] = useState(false);
  const [expandedClaude, setExpandedClaude] = useState(false);

  return (
    <div className="divide-y-2 divide-border-primary">
      {/* GPT Response */}
      {gptResponse && (
        <div>
          <button
            onClick={() => setExpandedGpt(!expandedGpt)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-green"></div>
              <span className="text-sm font-medium text-text-secondary">
                GPT-5.2 Response
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${
                expandedGpt ? 'rotate-180' : ''
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
          <div
            className={`transition-expand overflow-hidden ${
              expandedGpt ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 pb-4 overflow-y-auto max-h-[450px]">
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                {gptResponse}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Claude Response */}
      {claudeResponse && (
        <div>
          <button
            onClick={() => setExpandedClaude(!expandedClaude)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-amber"></div>
              <span className="text-sm font-medium text-text-secondary">
                Claude Response
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${
                expandedClaude ? 'rotate-180' : ''
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
          <div
            className={`transition-expand overflow-hidden ${
              expandedClaude ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 pb-4 overflow-y-auto max-h-[450px]">
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                {claudeResponse}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
