'use client';

interface ShareButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ShareButton({ onClick, disabled }: ShareButtonProps) {
  const handleClick = () => {
    console.log('ShareButton clicked');
    alert('Share button clicked!'); // DEBUG - remove later
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        disabled
          ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      Share
    </button>
  );
}
