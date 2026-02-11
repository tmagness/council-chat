'use client';

import { ReactNode } from 'react';

type Mode = 'council' | 'gpt-only' | 'claude-only';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  arbiterEnabled: boolean;
  setArbiterEnabled: (enabled: boolean) => void;
  onOpenSettings?: () => void;
  children?: ReactNode;
}

export default function Header({
  mode,
  setMode,
  arbiterEnabled,
  setArbiterEnabled,
  onOpenSettings,
  children,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-border-primary bg-bg-secondary flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-accent-blue/20 flex items-center justify-center">
          <span className="text-accent-blue font-mono font-semibold text-sm">AI</span>
        </div>
        <span className="font-semibold text-text-primary tracking-tight">Council</span>
      </div>

      {/* Mode Selector & Arbiter Toggle */}
      <div className="flex items-center gap-6">
        {/* Segmented Control */}
        <div className="flex rounded-lg bg-bg-tertiary p-1 gap-1">
          <button
            onClick={() => setMode('council')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'council'
                ? 'bg-accent-blue text-bg-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Council
          </button>
          <button
            onClick={() => setMode('gpt-only')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'gpt-only'
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            GPT
          </button>
          <button
            onClick={() => setMode('claude-only')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'claude-only'
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Claude
          </button>
        </div>

        {/* Arbiter Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <span className={`text-sm ${mode !== 'council' ? 'text-text-muted' : 'text-text-secondary'}`}>
            Arbiter
          </span>
          <button
            onClick={() => mode === 'council' && setArbiterEnabled(!arbiterEnabled)}
            disabled={mode !== 'council'}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              mode !== 'council'
                ? 'bg-bg-tertiary cursor-not-allowed'
                : arbiterEnabled
                ? 'bg-accent-blue'
                : 'bg-bg-tertiary hover:bg-bg-elevated'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-text-primary transition-transform ${
                arbiterEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </label>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}

        {/* Share Button (passed as children) */}
        {children}
      </div>
    </header>
  );
}
