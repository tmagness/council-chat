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
  const [expandedGpt, setExpandedGpt] = useState(false);
  const [expandedClaude, setExpandedClaude] = useState(false);

  if (!gptResponse && !claudeResponse) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-border-primary">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Raw Responses
        </h3>
      </div>

      {/* GPT Response */}
      {gptResponse && (
        <div className="border-b border-border-primary last:border-b-0">
          <button
            onClick={() => setExpandedGpt(!expandedGpt)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-elevated transition-colors"
          >
            <span className="text-sm font-medium text-text-secondary">
              GPT-4o Response
            </span>
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
              <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
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
            <span className="text-sm font-medium text-text-secondary">
              Claude Response
            </span>
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
              <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
                {claudeResponse}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
