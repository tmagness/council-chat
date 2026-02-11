'use client';

import { useState, useEffect, useRef } from 'react';
import { UIMessage, MergeResult, ChatResponse } from '@/lib/types';

type Mode = 'council' | 'gpt-only' | 'claude-only';

// Confidence badge colors
const confidenceColors = {
  high: '#22c55e',
  medium: '#eab308',
  low: '#ef4444',
};

export default function Home() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<Mode>('council');
  const [arbiterEnabled, setArbiterEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Create new thread on mount
  useEffect(() => {
    async function createThread() {
      try {
        const res = await fetch('/api/threads', { method: 'POST' });
        const data = await res.json();
        setThreadId(data.thread_id);
      } catch (error) {
        console.error('Failed to create thread:', error);
      }
    }
    createThread();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || !threadId || loading) return;

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          message: userMessage.content,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Render the structured merge result
  const renderMergeResult = (merge: MergeResult, msgId: string) => {
    const hasDeltas = merge.deltas && merge.deltas.length > 0;
    const hasAssumptions = merge.unverified_assumptions && merge.unverified_assumptions.length > 0;
    const hasNextSteps = merge.next_steps && merge.next_steps.length > 0;

    return (
      <>
        {/* Consensus - Main recommendation */}
        <div className="consensus">
          <div className="consensus-header">
            <span>Recommendation</span>
            <span
              className="confidence-badge"
              style={{ backgroundColor: confidenceColors[merge.confidence] }}
            >
              {merge.confidence} confidence
            </span>
          </div>
          <div className="message-content">{merge.consensus}</div>
        </div>

        {/* Deltas - Points of disagreement */}
        {hasDeltas && (
          <div className="deltas">
            <div className="deltas-header">Points of Disagreement</div>
            {merge.deltas.map((delta, i) => (
              <div key={i} className="delta-item">
                <div className="delta-topic">{delta.topic}</div>
                <div className="delta-positions">
                  <div className={delta.recommended === 'gpt' ? 'winner' : ''}>
                    <strong>GPT:</strong> {delta.gpt_position}
                    {delta.recommended === 'gpt' && <span className="winner-badge">Selected</span>}
                  </div>
                  <div className={delta.recommended === 'claude' ? 'winner' : ''}>
                    <strong>Claude:</strong> {delta.claude_position}
                    {delta.recommended === 'claude' && <span className="winner-badge">Selected</span>}
                  </div>
                  <div className="delta-reasoning">
                    <strong>Reasoning:</strong> {delta.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unverified Assumptions - Warning section */}
        {hasAssumptions && (
          <div className="assumptions">
            <div className="assumptions-header">Unverified Assumptions</div>
            <ul>
              {merge.unverified_assumptions.map((assumption, i) => (
                <li key={i}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps - Actionable items */}
        {hasNextSteps && (
          <div className="next-steps">
            <div className="next-steps-header">Next Steps</div>
            <ol>
              {merge.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Decision Filter Notes - Collapsible */}
        {merge.decision_filter_notes && (
          <div className="collapsible">
            <div
              className="collapsible-header"
              onClick={() => toggleSection(`filters-${msgId}`)}
            >
              {expandedSections[`filters-${msgId}`] ? '▼' : '▶'} Decision Filter Analysis
            </div>
            {expandedSections[`filters-${msgId}`] && (
              <div className="collapsible-content">{merge.decision_filter_notes}</div>
            )}
          </div>
        )}
      </>
    );
  };

  const renderMessage = (msg: UIMessage) => {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className="message user">
          <div className="message-header">
            <span className="message-role">You</span>
          </div>
          <div className="message-content">{msg.content}</div>
        </div>
      );
    }

    const hasMultipleResponses = msg.gpt_response && msg.claude_response;
    const hasMerge = msg.merge_result;

    return (
      <div key={msg.id} className="message assistant">
        <div className="message-header">
          <span className="message-role">
            Council{' '}
            {msg.mode && (
              <span className={`mode-badge ${msg.mode === 'degraded' ? 'degraded' : ''}`}>
                {msg.mode}
              </span>
            )}
          </span>
          {msg.estimated_cost && <span className="message-cost">{msg.estimated_cost}</span>}
        </div>

        {hasMerge ? (
          <>
            {renderMergeResult(msg.merge_result!, msg.id)}

            {/* Arbiter Review */}
            {msg.arbiter_review && (
              <div className="arbiter-review">
                <div className="arbiter-header">Arbiter Review</div>
                <div className="message-content">{msg.arbiter_review}</div>
              </div>
            )}
          </>
        ) : (
          <div className="message-content">{msg.content}</div>
        )}

        {/* Raw responses - always collapsible */}
        {hasMultipleResponses && (
          <div className="collapsible">
            <div
              className="collapsible-header"
              onClick={() => toggleSection(`gpt-${msg.id}`)}
            >
              {expandedSections[`gpt-${msg.id}`] ? '▼' : '▶'} GPT-4o Response
            </div>
            {expandedSections[`gpt-${msg.id}`] && (
              <div className="collapsible-content">{msg.gpt_response}</div>
            )}

            <div
              className="collapsible-header"
              onClick={() => toggleSection(`claude-${msg.id}`)}
            >
              {expandedSections[`claude-${msg.id}`] ? '▼' : '▶'} Claude Response
            </div>
            {expandedSections[`claude-${msg.id}`] && (
              <div className="collapsible-content">{msg.claude_response}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="container">
      <header className="header">
        <h1>AI Council</h1>
        <p>Collaborative decision-making with GPT-4o and Claude</p>
      </header>

      <div className="controls">
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'council' ? 'active' : ''}`}
            onClick={() => setMode('council')}
          >
            Council
          </button>
          <button
            className={`mode-btn ${mode === 'gpt-only' ? 'active' : ''}`}
            onClick={() => setMode('gpt-only')}
          >
            GPT Only
          </button>
          <button
            className={`mode-btn ${mode === 'claude-only' ? 'active' : ''}`}
            onClick={() => setMode('claude-only')}
          >
            Claude Only
          </button>
        </div>

        <label className="arbiter-toggle">
          <input
            type="checkbox"
            checked={arbiterEnabled}
            onChange={(e) => setArbiterEnabled(e.target.checked)}
            disabled={mode !== 'council'}
          />
          Enable Arbiter Review
        </label>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Send a message to start the council deliberation</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>Council is deliberating...</span>
          </div>
        )}
      </div>

      <div className="input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the council a question..."
          disabled={loading || !threadId}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={loading || !inputText.trim() || !threadId}
        >
          Send
        </button>
      </div>
    </main>
  );
}
