'use client';

interface ArbiterCardProps {
  review: string;
}

// Extract verdict from review text
function extractVerdict(review: string): 'PROCEED' | 'REVISE' | 'ESCALATE' | null {
  const upperReview = review.toUpperCase();
  if (upperReview.includes('PROCEED')) return 'PROCEED';
  if (upperReview.includes('REVISE')) return 'REVISE';
  if (upperReview.includes('ESCALATE')) return 'ESCALATE';
  return null;
}

const verdictConfig = {
  PROCEED: {
    bg: 'bg-accent-green',
    text: 'text-bg-primary',
  },
  REVISE: {
    bg: 'bg-accent-amber',
    text: 'text-bg-primary',
  },
  ESCALATE: {
    bg: 'bg-accent-red',
    text: 'text-text-primary',
  },
};

export default function ArbiterCard({ review }: ArbiterCardProps) {
  if (!review) return null;

  const verdict = extractVerdict(review);

  return (
    <div className="bg-bg-tertiary rounded-lg border-l-4 border-accent-green p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-accent-green uppercase tracking-wider">
          Arbiter Review
        </h3>
        {verdict && (
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${verdictConfig[verdict].bg} ${verdictConfig[verdict].text}`}
          >
            {verdict}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-text-secondary leading-relaxed">{review}</p>
    </div>
  );
}
