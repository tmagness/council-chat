'use client';

import { useState, useEffect } from 'react';
import CouncilEmblem from './CouncilEmblem';

interface EmptyStateProps {
  mode: 'council' | 'gpt-only' | 'claude-only';
  arbiterEnabled: boolean;
}

export default function EmptyState({ mode, arbiterEnabled }: EmptyStateProps) {
  const [showEmblem, setShowEmblem] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showSubtext, setShowSubtext] = useState(false);
  const [showStatus, setShowStatus] = useState([false, false, false]);

  const title = 'COUNCIL ONLINE';

  useEffect(() => {
    // Boot sequence animation
    const timers: NodeJS.Timeout[] = [];

    // 1. Show emblem (fade in)
    timers.push(setTimeout(() => setShowEmblem(true), 100));

    // 2. Typewriter effect for title
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex <= title.length) {
        setTypedText(title.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
    timers.push(setTimeout(() => clearInterval(typeInterval), 100 + title.length * 50 + 100));

    // 3. Show subtext
    timers.push(setTimeout(() => setShowSubtext(true), 100 + title.length * 50 + 200));

    // 4. Stagger status indicators
    timers.push(setTimeout(() => setShowStatus([true, false, false]), 100 + title.length * 50 + 400));
    timers.push(setTimeout(() => setShowStatus([true, true, false]), 100 + title.length * 50 + 500));
    timers.push(setTimeout(() => setShowStatus([true, true, true]), 100 + title.length * 50 + 600));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(typeInterval);
    };
  }, []);

  const getGptStatus = () => {
    if (mode === 'claude-only') return { status: 'OFFLINE', color: 'text-text-muted' };
    return { status: 'STANDBY', color: 'text-accent-green' };
  };

  const getClaudeStatus = () => {
    if (mode === 'gpt-only') return { status: 'OFFLINE', color: 'text-text-muted' };
    return { status: 'STANDBY', color: 'text-accent-green' };
  };

  const getArbiterStatus = () => {
    if (!arbiterEnabled) return { status: 'OFF', color: 'text-text-muted' };
    return { status: 'ARMED', color: 'text-accent-green' };
  };

  const gptStatus = getGptStatus();
  const claudeStatus = getClaudeStatus();
  const arbiterStatus = getArbiterStatus();

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
      {/* Grid overlay background */}
      <div className="absolute inset-0 grid-overlay pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
      </div>

      {/* Main content */}
      <div className="text-center z-10">
        {/* Emblem */}
        <div className={`transition-all duration-500 ease-out ${showEmblem ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <CouncilEmblem />
        </div>

        {/* Title with typewriter effect */}
        <h2 className="text-2xl font-bold text-text-primary tracking-[0.3em] mb-3 h-8">
          {typedText}
          <span className={`inline-block w-0.5 h-6 bg-accent-blue ml-1 ${typedText.length === title.length ? 'animate-cursor-blink' : ''}`} />
        </h2>

        {/* Subtext */}
        <div className={`transition-all duration-300 ${showSubtext ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <p className="text-sm text-text-muted font-mono mb-6 max-w-md mx-auto leading-relaxed">
            Multi-model decision synthesis ready.<br />
            Two AI models. Independent analysis. One recommendation.
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-6 font-mono text-xs">
          {/* GPT Status */}
          <div className={`flex items-center gap-2 transition-all duration-200 ${showStatus[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className={`w-2 h-2 rounded-full ${gptStatus.color === 'text-accent-green' ? 'bg-accent-green animate-status-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">GPT-4o</span>
            <span className={gptStatus.color}>{gptStatus.status}</span>
          </div>

          {/* Separator */}
          <span className={`text-border-secondary transition-all duration-200 ${showStatus[1] ? 'opacity-100' : 'opacity-0'}`}>│</span>

          {/* Claude Status */}
          <div className={`flex items-center gap-2 transition-all duration-200 ${showStatus[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className={`w-2 h-2 rounded-full ${claudeStatus.color === 'text-accent-green' ? 'bg-accent-green animate-status-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">Claude</span>
            <span className={claudeStatus.color}>{claudeStatus.status}</span>
          </div>

          {/* Separator */}
          <span className={`text-border-secondary transition-all duration-200 ${showStatus[2] ? 'opacity-100' : 'opacity-0'}`}>│</span>

          {/* Arbiter Status */}
          <div className={`flex items-center gap-2 transition-all duration-200 ${showStatus[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className={`w-2 h-2 rounded-full ${arbiterStatus.color === 'text-accent-green' ? 'bg-accent-green animate-status-pulse' : 'bg-text-muted'}`} />
            <span className="text-text-secondary">Arbiter</span>
            <span className={arbiterStatus.color}>{arbiterStatus.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
