'use client';

import { useState } from 'react';
import { ClaudeMdUpdate } from '@/lib/types';

interface ContextUpdateCardProps {
  update: ClaudeMdUpdate;
}

export default function ContextUpdateCard({ update }: ContextUpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    return `## Current Status
${update.current_status}

## Recent Changes
${update.recent_changes.map(change => `- ${change}`).join('\n')}

## Planned Next
${update.planned_next.map(item => `- ${item}`).join('\n')}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border-2 border-dashed border-border-secondary rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="text-sm font-medium text-text-muted">
            Project Context Update
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border-secondary">
          {/* Copy Button */}
          <div className="flex justify-end mt-3 mb-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                copied
                  ? 'bg-accent-green/20 text-accent-green'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>

          {/* Current Status */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Current Status
            </h4>
            <p className="text-sm text-text-secondary bg-bg-tertiary rounded p-3">
              {update.current_status}
            </p>
          </div>

          {/* Recent Changes */}
          {update.recent_changes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Recent Changes
              </h4>
              <ul className="space-y-1">
                {update.recent_changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-blue mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Planned Next */}
          {update.planned_next.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Planned Next
              </h4>
              <ul className="space-y-1">
                {update.planned_next.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-green mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Help Text */}
          <p className="mt-4 text-xs text-text-muted italic">
            Copy this content and paste it into your project's CLAUDE.md file to keep context updated.
          </p>
        </div>
      )}
    </div>
  );
}
