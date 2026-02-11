'use client';

interface NextStepsCardProps {
  steps: string[];
}

export default function NextStepsCard({ steps }: NextStepsCardProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-blue/50 p-5">
      {/* Header */}
      <h3 className="text-xs font-semibold text-accent-blue uppercase tracking-wider mb-4">
        Next Steps
      </h3>

      {/* List */}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-mono font-semibold text-text-secondary">
              {index + 1}
            </span>
            <span className="text-sm text-text-primary leading-relaxed pt-0.5">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
