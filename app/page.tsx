'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UIMessage, ChatResponse, ImageAttachment } from '@/lib/types';
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
import StickyNav from './components/StickyNav';
import ContextUpdateCard from './components/ContextUpdateCard';
import EmptyState from './components/EmptyState';

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
  const [error, setError] = useState<string | null>(null);
  const [sessionCost, setSessionCost] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const handleSubmit = async (message: string, images: ImageAttachment[] = []) => {
    if (!currentThreadId || loading) return;

    // Update thread's first message if this is the first message
    const displayMessage = message || (images.length > 0 ? '[Image]' : '');
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentThreadId && !t.firstMessage
          ? { ...t, firstMessage: displayMessage.slice(0, 50) + (displayMessage.length > 50 ? '...' : '') }
          : t
      )
    );

    // Add user message
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      images: images.length > 0 ? images : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: currentThreadId,
          message,
          mode,
          arbiter: arbiterEnabled,
          images: images.length > 0 ? images : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

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

        // Update session cost tracking
        if (data.estimated_cost) {
          const costValue = parseFloat(data.estimated_cost.replace('$', ''));
          if (!isNaN(costValue)) {
            setSessionCost((prev) => prev + costValue);
            setQueryCount((prev) => prev + 1);
          }
        }
      } else {
        const errorMsg = data.error || `Request failed with status ${res.status}`;
        console.error('Chat error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. The image may be too large or the servers are busy. Try a smaller image or try again.');
      } else {
        setError('Failed to send message. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get the latest assistant message for display
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  // Handle scroll to show/hide sticky nav
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || !sectionRefs.current.consensus) return;

      const consensusRect = sectionRefs.current.consensus.getBoundingClientRect();
      const scrollContainerRect = scrollRef.current.getBoundingClientRect();

      // Show sticky nav when consensus card is scrolled above the viewport
      setShowStickyNav(consensusRect.bottom < scrollContainerRect.top + 100);
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  // Jump to section handler
  const handleJumpTo = useCallback((section: string) => {
    const element = sectionRefs.current[section];
    if (element && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const elementTop = element.offsetTop - scrollContainer.offsetTop - 20;
      scrollContainer.scrollTo({ top: elementTop, behavior: 'smooth' });
    }
  }, []);

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
          {/* Sticky Navigation */}
          {latestAssistantMessage?.merge_result && (
            <StickyNav
              mergeResult={latestAssistantMessage.merge_result}
              visible={showStickyNav}
              onJumpTo={handleJumpTo}
            />
          )}

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && !loading ? (
              // Empty State - Sci-Fi Command Center
              <EmptyState mode={mode} arbiterEnabled={arbiterEnabled} />
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
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                              {msg.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={`data:${img.media_type};base64,${img.data}`}
                                  alt={`Attachment ${idx + 1}`}
                                  className="max-w-xs max-h-48 rounded-lg border border-border-primary"
                                />
                              ))}
                            </div>
                          )}
                          {msg.content && <p className="text-sm text-text-primary">{msg.content}</p>}
                        </div>
                      </div>
                    ) : (
                      // Assistant Response
                      <div className="space-y-4">
                        {msg.merge_result ? (
                          <>
                            <div ref={(el) => { sectionRefs.current.consensus = el; }}>
                              <ConsensusCard
                                consensus={msg.merge_result.consensus}
                                confidence={msg.merge_result.confidence}
                              />
                            </div>
                            <div ref={(el) => { sectionRefs.current.deltas = el; }}>
                              <DeltasCard deltas={msg.merge_result.deltas} />
                            </div>
                            <div ref={(el) => { sectionRefs.current.assumptions = el; }}>
                              <AssumptionsCard
                                assumptions={msg.merge_result.unverified_assumptions}
                              />
                            </div>
                            <div ref={(el) => { sectionRefs.current.nextsteps = el; }}>
                              <NextStepsCard steps={msg.merge_result.next_steps} />
                            </div>
                            <DecisionFiltersCard
                              notes={msg.merge_result.decision_filter_notes}
                            />
                            {msg.arbiter_review && (
                              <ArbiterCard review={msg.arbiter_review} />
                            )}
                            <div ref={(el) => { sectionRefs.current.raw = el; }}>
                              <RawResponses
                                gptResponse={msg.gpt_response || null}
                                claudeResponse={msg.claude_response || null}
                              />
                            </div>
                            {msg.estimated_cost && msg.mode && (
                              <MetaBar
                                cost={msg.estimated_cost}
                                mode={msg.mode}
                                sessionCost={`$${sessionCost.toFixed(2)}`}
                                queryCount={queryCount}
                              />
                            )}
                            {msg.merge_result.claude_md_update && (
                              <ContextUpdateCard update={msg.merge_result.claude_md_update} />
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

                {/* Error State */}
                {error && !loading && (
                  <div className="bg-accent-red/10 border-2 border-accent-red rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-accent-red mb-1">Error</h4>
                        <p className="text-sm text-text-primary">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="mt-2 text-xs text-accent-blue hover:underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
