import { NextRequest, NextResponse } from 'next/server';
import { callGPT } from '@/lib/providers/openai';
import { callClaude } from '@/lib/providers/anthropic';
import { mergeCouncil } from '@/lib/merge/mergeCouncil';
import { arbiterReview } from '@/lib/merge/arbiterReview';
import { superchargedMerge } from '@/lib/merge/superchargedMerge';
import { searchTavily, formatSearchContext } from '@/lib/providers/tavily';
import { getThreadHistory, addMessage } from '@/lib/storage/threadsRepo';
import { getProjectContext } from '@/lib/storage/configRepo';
import {
  GPT_SYSTEM_PROMPT,
  CLAUDE_SYSTEM_PROMPT,
  SUPERCHARGED_GPT_SYSTEM_PROMPT,
  SUPERCHARGED_CLAUDE_SYSTEM_PROMPT,
} from '@/lib/merge/prompts';
import { calculateCost, calculateSuperchargedCost, formatCost } from '@/lib/utils/costs';
import { ChatRequest, ChatResponse, MergeResult, HistoryMessage, ImageAttachment, TavilySearchResult } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thread_id, message, mode, arbiter, images } = body as ChatRequest;

    // Validate input
    if (!thread_id || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: thread_id, mode' },
        { status: 400 }
      );
    }

    // Require either a message or images
    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'Either a message or images are required' },
        { status: 400 }
      );
    }

    if (!['council', 'gpt-only', 'claude-only', 'supercharged'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be council, gpt-only, claude-only, or supercharged' },
        { status: 400 }
      );
    }

    // Get thread history (user messages + consensus only)
    const history = await getThreadHistory(thread_id);

    // Fetch and prepend project context if available
    const projectContext = await getProjectContext();
    const messagesWithCurrent: HistoryMessage[] = [
      ...(projectContext ? [{ role: 'user' as const, content: `[PROJECT CONTEXT]\n${projectContext}` }] : []),
      ...history,
      { role: 'user', content: message, images },
    ];

    let gptResponse: string | null = null;
    let claudeResponse: string | null = null;
    let mergeResult: MergeResult | null = null;
    let arbiterResult: string | null = null;
    let searchResults: TavilySearchResult[] = [];
    let passesUsed: number | undefined = undefined;
    let totalGptTokens = 0;
    let totalClaudeTokens = 0;
    let finalMode: 'council' | 'gpt-only' | 'claude-only' | 'supercharged' | 'degraded' = mode;

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

          // Arbiter review if requested - pass full merge result for critique
          if (arbiter) {
            const arbiterOutput = await arbiterReview(
              message,
              gptResponse,
              claudeResponse,
              mergeResult
            );

            if (arbiterOutput) {
              arbiterResult = arbiterOutput.review;
              totalClaudeTokens += arbiterOutput.tokens_used;
            }
          }
        }
      }
    } else if (mode === 'supercharged') {
      // Pass 1: Web search for real-time context
      searchResults = await searchTavily(message);
      const searchContext = formatSearchContext(searchResults);

      // Build enhanced messages with search context prepended to user query
      const enhancedMessages: HistoryMessage[] = messagesWithCurrent.map((m, idx) => {
        if (idx === messagesWithCurrent.length - 1 && m.role === 'user') {
          // Prepend search context to the current user message
          return {
            ...m,
            content: searchContext + m.content,
          };
        }
        return m;
      });

      // Pass 2: Call both providers in parallel (blind independence) with Opus for Claude
      const [gptResult, claudeResult] = await Promise.all([
        callGPT(SUPERCHARGED_GPT_SYSTEM_PROMPT, enhancedMessages),
        callClaude(SUPERCHARGED_CLAUDE_SYSTEM_PROMPT, enhancedMessages, 'opus'),
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
      } else {
        // Passes 3-5: Multi-pass synthesis with Opus
        const superchargedOutput = await superchargedMerge(
          message,
          gptResponse,
          claudeResponse,
          history,
          searchResults
        );

        if (superchargedOutput) {
          mergeResult = superchargedOutput.result;
          arbiterResult = superchargedOutput.arbiter_review;
          totalClaudeTokens += superchargedOutput.tokens_used;
          passesUsed = superchargedOutput.passes_used;
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

    // Calculate cost (use supercharged pricing for supercharged mode)
    const totalTokens = totalGptTokens + totalClaudeTokens;
    const estimatedCost =
      mode === 'supercharged'
        ? calculateSuperchargedCost(totalGptTokens, totalClaudeTokens, searchResults.length > 0)
        : calculateCost(totalGptTokens, totalClaudeTokens);
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
      content: message || '[Image attachment]',
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
      ...(searchResults.length > 0 && { search_results: searchResults }),
      ...(passesUsed !== undefined && { passes_used: passesUsed }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
