'use client';

interface AssumptionsCardProps {
  assumptions: string[];
}

export default function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  if (!assumptions || assumptions.length === 0) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-red p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-accent-red"
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
        <h3 className="text-xs font-semibold text-accent-red uppercase tracking-wider">
          Unverified Assumptions
        </h3>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {assumptions.map((assumption, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-text-secondary"
          >
            <span className="text-accent-red mt-1">•</span>
            <span>{assumption}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
