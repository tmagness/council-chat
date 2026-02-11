'use client';

interface ConsensusCardProps {
  consensus: string;
  confidence: 'high' | 'medium' | 'low';
}

const confidenceConfig = {
  high: {
    color: 'text-accent-green',
    bg: 'bg-accent-green',
    label: 'HIGH',
  },
  medium: {
    color: 'text-accent-amber',
    bg: 'bg-accent-amber',
    label: 'MEDIUM',
  },
  low: {
    color: 'text-accent-red',
    bg: 'bg-accent-red',
    label: 'LOW',
  },
};

export default function ConsensusCard({ consensus, confidence }: ConsensusCardProps) {
  const config = confidenceConfig[confidence];

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-blue border-2 border-l-4 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border-primary">
        <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider">
          Consensus
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated">
          <span className={`w-2.5 h-2.5 rounded-full ${config.bg} animate-pulse`} />
          <span className={`text-xs font-mono font-bold ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-text-primary leading-relaxed font-mono text-sm">
        {consensus}
      </p>
    </div>
  );
}
