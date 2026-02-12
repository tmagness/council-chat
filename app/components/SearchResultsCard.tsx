'use client';

import { useState } from 'react';
import { TavilySearchResult } from '@/lib/types';

interface SearchResultsCardProps {
  results: TavilySearchResult[];
}

export default function SearchResultsCard({ results }: SearchResultsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-amber-500 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Web Search Results
          </h3>
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">
            {results.length} sources
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border-primary">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="p-4 border-b border-border-primary last:border-b-0 hover:bg-bg-elevated/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-text-muted mt-1">[{idx + 1}]</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent-blue hover:underline block truncate"
                  >
                    {result.title}
                  </a>
                  <p className="text-xs text-text-muted truncate mt-0.5">{result.url}</p>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-3">{result.content}</p>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {(result.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
