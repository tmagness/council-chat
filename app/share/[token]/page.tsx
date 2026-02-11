import { notFound } from 'next/navigation';
import { getThreadByShareToken } from '@/lib/storage/shareRepo';
import { MergeResult } from '@/lib/types';
import ConsensusCard from '@/app/components/ConsensusCard';
import DeltasCard from '@/app/components/DeltasCard';
import AssumptionsCard from '@/app/components/AssumptionsCard';
import NextStepsCard from '@/app/components/NextStepsCard';
import DecisionFiltersCard from '@/app/components/DecisionFiltersCard';
import ArbiterCard from '@/app/components/ArbiterCard';
import RawResponses from '@/app/components/RawResponses';
import MetaBar from '@/app/components/MetaBar';

interface SharedThreadPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedThreadPage({ params }: SharedThreadPageProps) {
  const { token } = await params;
  const thread = await getThreadByShareToken(token);

  if (!thread) {
    notFound();
  }

  // Parse messages with merge_result JSON
  const messages = thread.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    gpt_response: msg.gptResponse,
    claude_response: msg.claudeResponse,
    merge_result: msg.mergeResult
      ? (JSON.parse(msg.mergeResult) as MergeResult)
      : null,
    arbiter_review: msg.arbiterReview,
    mode: msg.mode,
    estimated_cost: `$${msg.estimatedCost.toFixed(4)}`,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Shared Thread Banner */}
      <header className="h-14 border-b border-border-primary bg-bg-secondary flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-blue/20 flex items-center justify-center">
            <span className="text-accent-blue font-mono font-semibold text-sm">AI</span>
          </div>
          <span className="font-semibold text-text-primary tracking-tight">Council</span>
          <span className="text-text-muted mx-2">/</span>
          <span className="text-text-secondary text-sm">Shared Thread</span>
        </div>
        <a
          href="/"
          className="px-4 py-1.5 rounded-lg bg-accent-blue text-bg-primary text-sm font-medium hover:bg-accent-blue/90 transition-colors"
        >
          Start Your Own
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Read-only Notice */}
          <div className="bg-bg-elevated border-2 border-border-primary rounded-lg p-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-text-secondary flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <p className="text-sm text-text-secondary">
              This is a read-only view of a shared AI Council decision thread.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end mb-4">
                  <div className="bg-bg-tertiary rounded-lg px-4 py-3 max-w-2xl">
                    <p className="text-sm text-text-primary">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {msg.merge_result ? (
                    <>
                      <ConsensusCard
                        consensus={msg.merge_result.consensus}
                        confidence={msg.merge_result.confidence}
                        consensusStrength={msg.merge_result.consensus_strength}
                        gptOverallConfidence={msg.merge_result.gpt_overall_confidence}
                        claudeOverallConfidence={msg.merge_result.claude_overall_confidence}
                        confidenceReasoning={msg.merge_result.confidence_reasoning}
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

          {/* Empty state if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted">This thread has no messages yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
