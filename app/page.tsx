'use client';

import { useState, useEffect, useRef } from 'react';
import { UIMessage, ChatResponse } from '@/lib/types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ConsensusCard from './components/ConsensusCard';
import DeltasCard from './components/DeltasCard';
import AssumptionsCard from './components/AssumptionsCard';
import NextStepsCard from './components/NextStepsCard';
import DecisionFiltersCard from './components/DecisionFiltersCard';
import ArbiterCard from './components/ArbiterCard';
import RawResponses from './components/RawResponses';
import InputArea from './components/InputArea';
import LoadingState from './components/LoadingState';
import MetaBar from './components/MetaBar';

type Mode = 'council' | 'gpt-only' | 'claude-only';

interface Thread {
  id: string;
  firstMessage: string;
  createdAt: Date;
}

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [mode, setMode] = useState<Mode>('council');
  const [arbiterEnabled, setArbiterEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create initial thread on mount
  useEffect(() => {
    createNewThread();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const createNewThread = async () => {
    try {
      const res = await fetch('/api/threads', { method: 'POST' });
      const data = await res.json();
      const newThread: Thread = {
        id: data.thread_id,
        firstMessage: '',
        createdAt: new Date(),
      };
      setThreads((prev) => [newThread, ...prev]);
      setCurrentThreadId(data.thread_id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleSelectThread = (threadId: string) => {
    // In a full implementation, you'd fetch messages for this thread
    setCurrentThreadId(threadId);
  };

  const handleSubmit = async (message: string) => {
    if (!currentThreadId || loading) return;

    // Update thread's first message if this is the first message
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentThreadId && !t.firstMessage
          ? { ...t, firstMessage: message.slice(0, 50) + (message.length > 50 ? '...' : '') }
          : t
      )
    );

    // Add user message
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: currentThreadId,
          message,
          mode,
          arbiter: arbiterEnabled,
        }),
      });

      const data: ChatResponse = await res.json();

      if (res.ok) {
        const assistantMessage: UIMessage = {
          id: data.message_id,
          role: 'assistant',
          content: data.merge_result?.consensus || data.gpt_response || data.claude_response || '',
          gpt_response: data.gpt_response,
          claude_response: data.claude_response,
          merge_result: data.merge_result,
          arbiter_review: data.arbiter_review,
          mode: data.mode,
          estimated_cost: data.estimated_cost,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        console.error('Chat error:', data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the latest assistant message for display
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <Header
        mode={mode}
        setMode={setMode}
        arbiterEnabled={arbiterEnabled}
        setArbiterEnabled={setArbiterEnabled}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          threads={threads}
          activeThreadId={currentThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={createNewThread}
        />

        {/* Main Response Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && !loading ? (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-accent-blue font-mono font-bold">?</span>
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    Ask the Council
                  </h2>
                  <p className="text-sm text-text-secondary max-w-md">
                    Submit a question to receive synthesized recommendations from GPT-4o and Claude,
                    with disagreements highlighted and assumptions flagged.
                  </p>
                </div>
              </div>
            ) : (
              // Message History & Response
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Previous Messages */}
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'user' ? (
                      // User Message
                      <div className="flex justify-end mb-4">
                        <div className="bg-bg-tertiary rounded-lg px-4 py-3 max-w-2xl">
                          <p className="text-sm text-text-primary">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      // Assistant Response
                      <div className="space-y-4">
                        {msg.merge_result ? (
                          <>
                            <ConsensusCard
                              consensus={msg.merge_result.consensus}
                              confidence={msg.merge_result.confidence}
                            />
                            <DeltasCard deltas={msg.merge_result.deltas} />
                            <AssumptionsCard
                              assumptions={msg.merge_result.unverified_assumptions}
                            />
                            <NextStepsCard steps={msg.merge_result.next_steps} />
                            <DecisionFiltersCard
                              notes={msg.merge_result.decision_filter_notes}
                            />
                            {msg.arbiter_review && (
                              <ArbiterCard review={msg.arbiter_review} />
                            )}
                            <RawResponses
                              gptResponse={msg.gpt_response || null}
                              claudeResponse={msg.claude_response || null}
                            />
                            {msg.estimated_cost && msg.mode && (
                              <MetaBar cost={msg.estimated_cost} mode={msg.mode} />
                            )}
                          </>
                        ) : (
                          // Single model response (non-council mode)
                          <div className="bg-bg-tertiary rounded-lg border-l-4 border-text-secondary p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                {msg.mode === 'gpt-only' ? 'GPT-4o' : 'Claude'} Response
                              </h3>
                              {msg.estimated_cost && (
                                <span className="text-xs font-mono text-text-muted">
                                  {msg.estimated_cost}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State */}
                {loading && <LoadingState />}
              </div>
            )}
          </div>

          {/* Input Area */}
          <InputArea
            onSubmit={handleSubmit}
            disabled={!currentThreadId}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
}
