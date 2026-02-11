'use client';

interface AssumptionsCardProps {
  assumptions: string[];
}

export default function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  if (!assumptions || assumptions.length === 0) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-red border-2 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border-primary">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-accent-red"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-sm font-bold text-accent-red uppercase tracking-wider">
            Unverified Assumptions
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-accent-red bg-accent-red/20 px-3 py-1 rounded-full">
          {assumptions.length}
        </span>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {assumptions.map((assumption, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-text-primary bg-bg-elevated p-3 rounded-lg border border-border-primary"
          >
            <span className="text-accent-red font-bold mt-0.5">!</span>
            <span className="leading-relaxed">{assumption}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
