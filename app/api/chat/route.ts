import { NextRequest, NextResponse } from 'next/server';
import { callGPT } from '@/lib/providers/openai';
import { callClaude } from '@/lib/providers/anthropic';
import { mergeCouncil } from '@/lib/merge/mergeCouncil';
import { arbiterReview } from '@/lib/merge/arbiterReview';
import { getThreadHistory, addMessage } from '@/lib/storage/threadsRepo';
import { GPT_SYSTEM_PROMPT, CLAUDE_SYSTEM_PROMPT } from '@/lib/merge/prompts';
import { calculateCost, formatCost } from '@/lib/utils/costs';
import { ChatRequest, ChatResponse, MergeResult, HistoryMessage } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thread_id, message, mode, arbiter } = body as ChatRequest;

    // Validate input
    if (!thread_id || !message || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: thread_id, message, mode' },
        { status: 400 }
      );
    }

    if (!['council', 'gpt-only', 'claude-only'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be council, gpt-only, or claude-only' },
        { status: 400 }
      );
    }

    // Get thread history (user messages + consensus only)
    const history = await getThreadHistory(thread_id);
    const messagesWithCurrent: HistoryMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    let gptResponse: string | null = null;
    let claudeResponse: string | null = null;
    let mergeResult: MergeResult | null = null;
    let arbiterResult: string | null = null;
    let totalGptTokens = 0;
    let totalClaudeTokens = 0;
    let finalMode: 'council' | 'gpt-only' | 'claude-only' | 'degraded' = mode;

    if (mode === 'council') {
      // Call GPT and Claude in parallel (blind independence)
      const [gptResult, claudeResult] = await Promise.all([
        callGPT(GPT_SYSTEM_PROMPT, messagesWithCurrent),
        callClaude(CLAUDE_SYSTEM_PROMPT, messagesWithCurrent),
      ]);

      if (gptResult) {
        gptResponse = gptResult.response;
        totalGptTokens += gptResult.tokens_used;
      }

      if (claudeResult) {
        claudeResponse = claudeResult.response;
        totalClaudeTokens += claudeResult.tokens_used;
      }

      // Handle degraded mode
      if (!gptResponse && !claudeResponse) {
        return NextResponse.json(
          { error: 'Both providers failed' },
          { status: 503 }
        );
      }

      if (!gptResponse || !claudeResponse) {
        finalMode = 'degraded';
        // Skip merge in degraded mode
      } else {
        // Merge responses
        const mergeOutput = await mergeCouncil(
          message,
          gptResponse,
          claudeResponse,
          history
        );

        if (mergeOutput) {
          mergeResult = mergeOutput.result;
          totalClaudeTokens += mergeOutput.tokens_used;

          // Arbiter review if requested
          if (arbiter) {
            const arbiterOutput = await arbiterReview(
              message,
              gptResponse,
              claudeResponse,
              mergeResult.consensus
            );

            if (arbiterOutput) {
              arbiterResult = arbiterOutput.review;
              totalClaudeTokens += arbiterOutput.tokens_used;
            }
          }
        }
      }
    } else if (mode === 'gpt-only') {
      const gptResult = await callGPT(GPT_SYSTEM_PROMPT, messagesWithCurrent);
      if (!gptResult) {
        return NextResponse.json(
          { error: 'GPT provider failed' },
          { status: 503 }
        );
      }
      gptResponse = gptResult.response;
      totalGptTokens += gptResult.tokens_used;
    } else if (mode === 'claude-only') {
      const claudeResult = await callClaude(CLAUDE_SYSTEM_PROMPT, messagesWithCurrent);
      if (!claudeResult) {
        return NextResponse.json(
          { error: 'Claude provider failed' },
          { status: 503 }
        );
      }
      claudeResponse = claudeResult.response;
      totalClaudeTokens += claudeResult.tokens_used;
    }

    // Calculate cost
    const totalTokens = totalGptTokens + totalClaudeTokens;
    const estimatedCost = calculateCost(totalGptTokens, totalClaudeTokens);
    const estimatedCostStr = formatCost(estimatedCost);

    // Determine content for storage (consensus or single response)
    let contentForStorage: string;
    if (mergeResult) {
      contentForStorage = mergeResult.consensus;
    } else if (gptResponse && !claudeResponse) {
      contentForStorage = gptResponse;
    } else if (claudeResponse && !gptResponse) {
      contentForStorage = claudeResponse;
    } else if (gptResponse) {
      contentForStorage = gptResponse; // Fallback if merge failed
    } else {
      contentForStorage = claudeResponse!;
    }

    // Save user message
    await addMessage(thread_id, {
      role: 'user',
      content: message,
      mode: finalMode,
      tokensUsed: 0,
      estimatedCost: 0,
    });

    // Save assistant message
    const savedMessage = await addMessage(thread_id, {
      role: 'assistant',
      content: contentForStorage,
      gptResponse,
      claudeResponse,
      mergeResult,
      arbiterReview: arbiterResult,
      mode: finalMode,
      tokensUsed: totalTokens,
      estimatedCost,
    });

    const response: ChatResponse = {
      thread_id,
      message_id: savedMessage.id,
      gpt_response: gptResponse,
      claude_response: claudeResponse,
      merge_result: mergeResult,
      arbiter_review: arbiterResult,
      mode: finalMode,
      tokens_used: totalTokens,
      estimated_cost: estimatedCostStr,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
