'use client';

import { useState, useEffect, useCallback } from 'react';
import { UIMessage } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  messages: UIMessage[];
}

export default function ShareModal({ isOpen, onClose, threadId, messages }: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShareUrl(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  const handleCreateShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/threads/${threadId}/share`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await res.json();
      setShareUrl(data.share_url);

      // Try native share API first (works on mobile and macOS)
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'AI Council Chat',
            text: getPreviewText(),
            url: data.share_url,
          });
          onClose();
          return;
        } catch (shareError) {
          // User cancelled or share failed, fall back to copy
          if ((shareError as Error).name !== 'AbortError') {
            console.log('Native share failed, falling back to copy');
          }
        }
      }

      // Fall back to clipboard
      await navigator.clipboard.writeText(data.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to share:', err);
      setError('Failed to create share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Get preview text from the last assistant message
  const getPreviewText = useCallback(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant?.merge_result?.consensus) {
      return lastAssistant.merge_result.consensus.slice(0, 200) + '...';
    }
    return lastAssistant?.content?.slice(0, 200) + '...' || 'AI Council conversation';
  }, [messages]);

  // Get conversation preview for display
  const getConversationPreview = () => {
    // Get last few messages for preview
    const recentMessages = messages.slice(-4);
    return recentMessages;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-primary rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">Share chat</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-text-secondary mb-4">
            Only messages up until now will be shared. Anyone with the link can view your shared chat.
          </p>

          {/* Conversation Preview */}
          <div className="bg-bg-tertiary rounded-lg border border-border-primary p-4 mb-4 max-h-48 overflow-y-auto">
            <div className="space-y-3">
              {getConversationPreview().map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-text-secondary' : 'text-text-primary'}`}>
                  <span className="font-medium text-xs text-text-muted uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Council'}
                  </span>
                  <p className="mt-1 line-clamp-3">
                    {msg.role === 'assistant' && msg.merge_result?.consensus
                      ? msg.merge_result.consensus.slice(0, 150) + (msg.merge_result.consensus.length > 150 ? '...' : '')
                      : msg.content?.slice(0, 150) + (msg.content && msg.content.length > 150 ? '...' : '')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Share URL (shown after creation) */}
          {shareUrl && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-2">Share link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary font-mono truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-accent-green/20 text-accent-green'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Info text */}
          <p className="text-xs text-text-muted">
            Your project context will not be shared with viewers.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-primary">
          <button
            onClick={handleCreateShareLink}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? 'bg-accent-blue/50 text-bg-primary cursor-not-allowed'
                : 'bg-accent-blue text-bg-primary hover:bg-accent-blue/90'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating link...
              </>
            ) : shareUrl ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link created!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
