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
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-blue p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-accent-blue uppercase tracking-wider">
          Consensus
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.bg}`} />
          <span className={`text-xs font-mono font-medium ${config.color}`}>
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
