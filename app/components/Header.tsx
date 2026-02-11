'use client';

type Mode = 'council' | 'gpt-only' | 'claude-only';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  arbiterEnabled: boolean;
  setArbiterEnabled: (enabled: boolean) => void;
}

export default function Header({
  mode,
  setMode,
  arbiterEnabled,
  setArbiterEnabled,
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
      </div>
    </header>
  );
}
