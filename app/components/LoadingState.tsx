'use client';

export default function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse-subtle">
      {/* Consensus skeleton */}
      <div className="bg-bg-tertiary rounded-lg border-l-4 border-border-primary p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </div>

      {/* Next steps skeleton */}
      <div className="bg-bg-tertiary rounded-lg border-l-4 border-border-primary p-5">
        <div className="skeleton h-4 w-28 rounded mb-4" />
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton h-4 w-4/5 rounded" />
          </div>
          <div className="flex items-start gap-3">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
          <div className="flex items-start gap-3">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 py-4">
        <svg
          className="w-5 h-5 text-accent-blue animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-text-secondary">Council is deliberating...</span>
      </div>
    </div>
  );
}
