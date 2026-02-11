'use client';

interface NextStepsCardProps {
  steps: string[];
}

export default function NextStepsCard({ steps }: NextStepsCardProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-green border-2 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border-primary">
        <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider">
          Next Steps
        </h3>
        <span className="text-xs font-mono font-bold text-accent-green bg-accent-green/20 px-3 py-1 rounded-full">
          {steps.length}
        </span>
      </div>

      {/* List */}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3 bg-bg-elevated p-3 rounded-lg border border-border-primary">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-green/20 border-2 border-accent-green/50 flex items-center justify-center text-xs font-mono font-bold text-accent-green">
              {index + 1}
            </span>
            <span className="text-sm text-text-primary leading-relaxed pt-1">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
