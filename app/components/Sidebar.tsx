'use client';

import { UIMessage } from '@/lib/types';

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
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border-primary bg-bg-secondary flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-primary">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Threads
        </h2>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p className="text-text-muted text-sm px-2 py-4">No threads yet</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
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
