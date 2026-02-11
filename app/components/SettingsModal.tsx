'use client';

import { useState, useEffect, useCallback } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [context, setContext] = useState('');
  const [originalContext, setOriginalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasChanges = context !== originalContext;

  // Fetch context when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen]);

  const fetchContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/context');
      const data = await res.json();
      if (res.ok) {
        const contextValue = data.context || '';
        setContext(contextValue);
        setOriginalContext(contextValue);
      } else {
        setError(data.error || 'Failed to load context');
      }
    } catch {
      setError('Failed to load context');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginalContext(context);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error || 'Failed to save context');
      }
    } catch {
      setError('Failed to save context');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    setContext(originalContext);
    setError(null);
    onClose();
  }, [originalContext, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-primary rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button
            onClick={handleCancel}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Project Context
              </label>
              <p className="text-xs text-text-muted mb-3">
                This context is automatically included with every query across all threads.
                Use it to describe your domain, key systems, priorities, and constraints.
              </p>
              {loading ? (
                <div className="h-64 bg-bg-tertiary rounded-lg flex items-center justify-center">
                  <span className="text-text-muted">Loading...</span>
                </div>
              ) : (
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Example:&#10;I'm an infrastructure systems architect working in oil & gas field operations.&#10;&#10;Key systems I work with:&#10;- SCADA for remote monitoring&#10;- Edge computing nodes at wellheads&#10;- Industrial IoT sensors&#10;&#10;Current priorities:&#10;- Reducing truck rolls for maintenance&#10;- Improving uptime of remote systems"
                  className="w-full h-64 px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary font-mono placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                />
              )}
            </div>

            {/* Character count */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                {context.length.toLocaleString()} characters
              </span>
              {saved && (
                <span className="text-accent-green flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-primary">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              saving || !hasChanges
                ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                : 'bg-accent-blue text-bg-primary hover:bg-accent-blue/90'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
