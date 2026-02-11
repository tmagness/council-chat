'use client';

import { useState, useEffect } from 'react';

const DELIBERATION_PHASES = [
  'Querying models...',
  'GPT-4o analyzing...',
  'Claude analyzing...',
  'Cross-referencing positions...',
  'Identifying consensus...',
  'Evaluating disagreements...',
  'Synthesizing decision...',
];

export default function LoadingState() {
  const [phase, setPhase] = useState(0);
  const [gptActive, setGptActive] = useState(false);
  const [claudeActive, setClaudeActive] = useState(false);
  const [mergeActive, setMergeActive] = useState(false);

  useEffect(() => {
    // Cycle through phases
    const phaseInterval = setInterval(() => {
      setPhase((p) => (p + 1) % DELIBERATION_PHASES.length);
    }, 2000);

    // Stagger model activation
    const gptTimer = setTimeout(() => setGptActive(true), 300);
    const claudeTimer = setTimeout(() => setClaudeActive(true), 600);
    const mergeTimer = setTimeout(() => setMergeActive(true), 1500);

    return () => {
      clearInterval(phaseInterval);
      clearTimeout(gptTimer);
      clearTimeout(claudeTimer);
      clearTimeout(mergeTimer);
    };
  }, []);

  return (
    <div className="relative py-12">
      {/* Grid overlay background */}
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-50" />

      {/* Main deliberation display */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated hexagonal emblem */}
        <div className="council-emblem relative w-24 h-24 mb-6">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full absolute inset-0"
          >
            {/* Outer spinning ring */}
            <polygon
              points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
              fill="none"
              stroke="url(#loadingGradient)"
              strokeWidth="1.5"
              className="animate-spin-slow origin-center"
              style={{ transformOrigin: '50px 50px' }}
            />

            {/* Middle pulsing ring */}
            <polygon
              points="50,12 86,31 86,69 50,88 14,69 14,31"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="0.75"
              opacity="0.6"
              className="animate-pulse"
            />

            {/* Inner hexagon */}
            <polygon
              points="50,20 79,35 79,65 50,80 21,65 21,35"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="0.5"
              opacity="0.3"
            />

            {/* Data streams - animated dashes */}
            <g stroke="#00d4ff" strokeWidth="0.5" opacity="0.5" strokeDasharray="3,3" className="animate-dash">
              <line x1="50" y1="5" x2="50" y2="20" />
              <line x1="93" y1="27.5" x2="79" y2="35" />
              <line x1="93" y1="72.5" x2="79" y2="65" />
              <line x1="50" y1="95" x2="50" y2="80" />
              <line x1="7" y1="72.5" x2="21" y2="65" />
              <line x1="7" y1="27.5" x2="21" y2="35" />
            </g>

            {/* Corner nodes - pulsing */}
            <g fill="#00d4ff" className="animate-pulse">
              <circle cx="50" cy="5" r="2" />
              <circle cx="93" cy="27.5" r="2" />
              <circle cx="93" cy="72.5" r="2" />
              <circle cx="50" cy="95" r="2" />
              <circle cx="7" cy="72.5" r="2" />
              <circle cx="7" cy="27.5" r="2" />
            </g>

            {/* Center processing indicator */}
            <circle
              cx="50"
              cy="50"
              r="12"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeDasharray="20,60"
              className="animate-spin"
              style={{ transformOrigin: '50px 50px' }}
            />

            <defs>
              <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4ff">
                  <animate attributeName="stop-color" values="#00d4ff;#0a84ff;#00d4ff" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#0a84ff">
                  <animate attributeName="stop-color" values="#0a84ff;#00d4ff;#0a84ff" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#00d4ff">
                  <animate attributeName="stop-color" values="#00d4ff;#0a84ff;#00d4ff" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
          </svg>

          {/* Center glow effect - more intense during loading */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent-blue/20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* Phase text with typewriter cursor */}
        <div className="text-center mb-6">
          <p className="text-sm font-mono text-accent-blue tracking-wider">
            {DELIBERATION_PHASES[phase]}
            <span className="inline-block w-0.5 h-4 bg-accent-blue ml-1 animate-cursor-blink align-middle" />
          </p>
        </div>

        {/* Model status indicators */}
        <div className="flex items-center justify-center gap-6 font-mono text-xs mb-8">
          {/* GPT Status */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${gptActive ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`w-2 h-2 rounded-full ${gptActive ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">GPT-4o</span>
            <span className={gptActive ? 'text-accent-green' : 'text-text-muted'}>
              {gptActive ? 'ACTIVE' : 'WAIT'}
            </span>
          </div>

          <span className="text-border-secondary">│</span>

          {/* Claude Status */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${claudeActive ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`w-2 h-2 rounded-full ${claudeActive ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">Claude</span>
            <span className={claudeActive ? 'text-accent-green' : 'text-text-muted'}>
              {claudeActive ? 'ACTIVE' : 'WAIT'}
            </span>
          </div>

          <span className="text-border-secondary">│</span>

          {/* Merge Status */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${mergeActive ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`w-2 h-2 rounded-full ${mergeActive ? 'bg-accent-amber animate-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">Merge</span>
            <span className={mergeActive ? 'text-accent-amber' : 'text-text-muted'}>
              {mergeActive ? 'SYNTH' : 'WAIT'}
            </span>
          </div>
        </div>

        {/* Skeleton cards hint */}
        <div className="w-full max-w-2xl space-y-3 opacity-30">
          <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-blue/30 p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-12 rounded" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -6; }
        }
        .animate-dash {
          animation: dash 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
