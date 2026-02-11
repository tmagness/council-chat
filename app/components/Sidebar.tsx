'use client';

import { useState } from 'react';

interface Thread {
  id: string;
  firstMessage: string;
  createdAt: Date;
}

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteAllThreads: () => void;
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onDeleteAllThreads,
}: SidebarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <aside className="w-64 border-r border-border-primary bg-bg-secondary flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-primary flex items-center justify-between">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Threads
        </h2>
        {threads.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-text-muted hover:text-accent-red transition-colors"
            title="Clear all threads"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="p-3 bg-accent-red/10 border-b border-accent-red/30">
          <p className="text-xs text-text-primary mb-2">Delete all threads?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDeleteAllThreads();
                setShowClearConfirm(false);
              }}
              className="px-2 py-1 text-xs bg-accent-red text-white rounded hover:bg-accent-red/80"
            >
              Yes, delete all
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-bg-elevated"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p className="text-text-muted text-sm px-2 py-4">No threads yet</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => (
              <li key={thread.id} className="group relative">
                <button
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors pr-8 ${
                    activeThreadId === thread.id
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
                  }`}
                >
                  <span className="block truncate font-medium">
                    {thread.firstMessage || 'New thread'}
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                </button>
                {/* Delete button - shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-all"
                  title="Delete thread"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Thread Button */}
      <div className="p-3 border-t border-border-primary">
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Thread
        </button>
      </div>
    </aside>
  );
}
