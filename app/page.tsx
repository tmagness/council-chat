'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UIMessage, ChatResponse, ImageAttachment, DocumentAttachment, ClientDocument, MergeResult } from '@/lib/types';
import { nanoid } from 'nanoid';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ShareButton from './components/ShareButton';
import ShareModal from './components/ShareModal';
import SettingsModal from './components/SettingsModal';
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
import SearchResultsCard from './components/SearchResultsCard';

type Mode = 'council' | 'gpt-only' | 'claude-only' | 'supercharged';

interface Thread {
  id: string;
  firstMessage: string;
  createdAt: Date;
}

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [threadDocuments, setThreadDocuments] = useState<ClientDocument[]>([]);
  const [mode, setMode] = useState<Mode>('council');
  const [arbiterEnabled, setArbiterEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCost, setSessionCost] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load existing threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      if (data.threads && data.threads.length > 0) {
        setThreads(
          data.threads.map((t: { id: string; first_message: string; created_at: string }) => ({
            id: t.id,
            firstMessage: t.first_message,
            createdAt: new Date(t.created_at),
          }))
        );
        // Select the most recent thread
        setCurrentThreadId(data.threads[0].id);
        // Load messages for that thread
        await loadThreadMessages(data.threads[0].id);
      } else {
        // No existing threads, create a new one
        await createNewThread();
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      // Fallback to creating a new thread
      await createNewThread();
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((msg: {
            id: string;
            role: 'user' | 'assistant';
            content: string;
            gpt_response?: string | null;
            claude_response?: string | null;
            merge_result?: MergeResult | null;
            arbiter_review?: string | null;
            mode?: string;
            estimated_cost?: string;
          }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            gpt_response: msg.gpt_response,
            claude_response: msg.claude_response,
            merge_result: msg.merge_result,
            arbiter_review: msg.arbiter_review,
            mode: msg.mode,
            estimated_cost: msg.estimated_cost,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error);
      setMessages([]);
    }
  };

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
      setThreadDocuments([]);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setCurrentThreadId(threadId);
    setThreadDocuments([]);
    await loadThreadMessages(threadId);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      // If we deleted the current thread, select another one or create new
      if (currentThreadId === threadId) {
        setThreadDocuments([]);
        const remaining = threads.filter((t) => t.id !== threadId);
        if (remaining.length > 0) {
          setCurrentThreadId(remaining[0].id);
          await loadThreadMessages(remaining[0].id);
        } else {
          await createNewThread();
        }
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleDeleteAllThreads = async () => {
    try {
      await fetch('/api/threads', { method: 'DELETE' });
      setThreads([]);
      setMessages([]);
      setThreadDocuments([]);
      await createNewThread();
    } catch (error) {
      console.error('Failed to delete all threads:', error);
    }
  };

  // Append newly-extracted documents to the thread stack as isNew=true.
  const handleAddDocuments = (docs: DocumentAttachment[]) => {
    setThreadDocuments((prev) => [
      ...prev,
      ...docs.map((d) => ({ ...d, id: nanoid(), isNew: true })),
    ]);
  };

  // Drop a doc from the going-forward stack. Does not edit historical UIMessages.
  const handleRemoveDocument = (id: string) => {
    setThreadDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (message: string, images: ImageAttachment[] = []) => {
    if (!currentThreadId || loading) return;

    // Documents are tracked at thread level (stacked across turns).
    // Snapshot the stack at submit time so a re-render mid-fetch can't mutate the payload.
    const stackSnapshot = threadDocuments;
    const newThisTurn = stackSnapshot.filter((d) => d.isNew);
    // Strip client-only fields (id, isNew) before sending to server
    const wireDocuments: DocumentAttachment[] = stackSnapshot.map(
      ({ id: _id, isNew: _isNew, ...rest }) => rest
    );

    // Update thread's first message if this is the first message
    const displayMessage =
      message ||
      (images.length > 0
        ? '[Image]'
        : newThisTurn.length > 0
        ? `[${newThisTurn[0].filename}]`
        : stackSnapshot.length > 0
        ? `[${stackSnapshot[0].filename}]`
        : '');
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentThreadId && !t.firstMessage
          ? { ...t, firstMessage: displayMessage.slice(0, 50) + (displayMessage.length > 50 ? '...' : '') }
          : t
      )
    );

    // Add user message — bubble shows only documents NEWLY added on this turn
    // (delta semantics; carried-over docs are not redrawn on each bubble).
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      images: images.length > 0 ? images : undefined,
      documents:
        newThisTurn.length > 0
          ? newThisTurn.map(({ id: _id, isNew: _isNew, ...rest }) => rest)
          : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Flip all isNew flags to false — they're now "carried" for any future turn.
    setThreadDocuments((prev) => prev.map((d) => ({ ...d, isNew: false })));

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
          documents: wireDocuments.length > 0 ? wireDocuments : undefined,
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
          search_results: data.search_results,
          passes_used: data.passes_used,
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
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      >
        {currentThreadId && messages.length > 0 && (
          <ShareButton onClick={() => setShareOpen(true)} />
        )}
      </Header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          threads={threads}
          activeThreadId={currentThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={createNewThread}
          onDeleteThread={handleDeleteThread}
          onDeleteAllThreads={handleDeleteAllThreads}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-6">
            {messages.length === 0 && !loading ? (
              // Empty State - Sci-Fi Command Center
              // Key forces remount when thread changes to replay animation
              <EmptyState key={currentThreadId} mode={mode} arbiterEnabled={arbiterEnabled} />
            ) : (
              // Message History & Response
              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {/* Previous Messages */}
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'user' ? (
                      // User Message
                      <div className="flex justify-end mb-4">
                        <div className="bg-bg-tertiary rounded-lg px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-2xl">
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
                          {msg.documents && msg.documents.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                              {msg.documents.map((doc, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-bg-secondary border border-border-primary text-xs"
                                  title={`${doc.text.length} chars extracted`}
                                >
                                  <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-text-primary font-medium truncate max-w-[180px]">{doc.filename}</span>
                                  <span className="text-text-muted font-mono">{doc.type.toUpperCase()}</span>
                                </div>
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
                            {/* Search Results (Supercharged mode) */}
                            {msg.search_results && msg.search_results.length > 0 && (
                              <SearchResultsCard results={msg.search_results} />
                            )}
                            <div ref={(el) => { sectionRefs.current.consensus = el; }}>
                              <ConsensusCard
                                consensus={msg.merge_result.consensus}
                                confidence={msg.merge_result.confidence}
                                consensusStrength={msg.merge_result.consensus_strength}
                                gptOverallConfidence={msg.merge_result.gpt_overall_confidence}
                                claudeOverallConfidence={msg.merge_result.claude_overall_confidence}
                                confidenceReasoning={msg.merge_result.confidence_reasoning}
                                isSupercharged={msg.mode === 'supercharged'}
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
                                passesUsed={msg.passes_used}
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
                                {msg.mode === 'gpt-only' ? 'GPT-5.4' : 'Claude Sonnet 4.6'} Response
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
            documents={threadDocuments}
            onAddDocuments={handleAddDocuments}
            onRemoveDocument={handleRemoveDocument}
          />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Share Modal */}
      {currentThreadId && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          threadId={currentThreadId}
          messages={messages}
        />
      )}
    </div>
  );
}
