'use client';

import { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}

export default function InputArea({ onSubmit, disabled, loading }: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled || loading) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border-primary bg-bg-secondary p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the council a question..."
            disabled={disabled || loading}
            rows={1}
            className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || loading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-blue text-bg-primary flex items-center justify-center hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <svg
              className="w-5 h-5 animate-spin"
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
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
