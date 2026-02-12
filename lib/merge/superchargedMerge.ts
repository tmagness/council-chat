import { callClaude } from '../providers/anthropic';
import { MergeResult, HistoryMessage, TavilySearchResult } from '../types';
import { mergeCouncil, MergeOutput } from './mergeCouncil';
import { arbiterReview, ArbiterOutput } from './arbiterReview';
import { FINAL_SYNTHESIS_PROMPT, buildFinalSynthesisMessages } from './prompts';

export interface SuperchargedMergeOutput {
  result: MergeResult;
  arbiter_review: string;
  tokens_used: number;
  passes_used: number;
}

/**
 * Extract JSON from LLM response, handling markdown fences and extra text
 */
function extractJSON(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith('{')) {
    let depth = 0;
    let end = 0;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++;
      if (trimmed[i] === '}') depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
    return trimmed.substring(0, end);
  }

  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return trimmed;
}

/**
 * Multi-pass synthesis orchestrator for supercharged mode.
 *
 * Flow:
 * 1. Initial merge synthesis (Pass 3)
 * 2. Arbiter review/critique (Pass 4)
 * 3. Final synthesis incorporating arbiter feedback (Pass 5)
 *
 * Note: Passes 1-2 (web search + blind responses) are handled in the route
 */
export async function superchargedMerge(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  threadHistory: HistoryMessage[],
  searchResults: TavilySearchResult[]
): Promise<SuperchargedMergeOutput | null> {
  let totalTokens = 0;

  // Pass 3: Initial merge synthesis with Opus
  const initialMerge = await mergeCouncilWithOpus(
    userQuery,
    gptResponse,
    claudeResponse,
    threadHistory
  );

  if (!initialMerge) {
    console.error('Supercharged: Initial merge failed');
    return null;
  }

  totalTokens += initialMerge.tokens_used;

  // Pass 4: Arbiter critique with Opus (always runs in supercharged mode)
  const arbiterOutput = await arbiterReviewWithOpus(
    userQuery,
    gptResponse,
    claudeResponse,
    initialMerge.result
  );

  if (!arbiterOutput) {
    console.error('Supercharged: Arbiter review failed');
    // Return initial merge result even if arbiter fails
    return {
      result: initialMerge.result,
      arbiter_review: 'Arbiter review failed.',
      tokens_used: totalTokens,
      passes_used: 3,
    };
  }

  totalTokens += arbiterOutput.tokens_used;

  // Pass 5: Final synthesis incorporating arbiter feedback with Opus
  const finalSynthesis = await finalSynthesisPass(
    userQuery,
    initialMerge.result,
    arbiterOutput.review
  );

  if (!finalSynthesis) {
    console.error('Supercharged: Final synthesis failed, using initial merge');
    // Fall back to initial merge if final synthesis fails
    return {
      result: initialMerge.result,
      arbiter_review: arbiterOutput.review,
      tokens_used: totalTokens,
      passes_used: 4,
    };
  }

  totalTokens += finalSynthesis.tokens_used;

  return {
    result: finalSynthesis.result,
    arbiter_review: arbiterOutput.review,
    tokens_used: totalTokens,
    passes_used: 5,
  };
}

/**
 * Call mergeCouncil using Opus model
 */
async function mergeCouncilWithOpus(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  threadHistory: HistoryMessage[]
): Promise<MergeOutput | null> {
  // Import the merge logic but use Opus
  // We need to duplicate the merge logic here to use Opus
  const { MERGE_PROMPT, buildMergeMessages } = await import('./prompts');

  const historyContext = threadHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const mergeMessage = buildMergeMessages(
    userQuery,
    gptResponse,
    claudeResponse,
    historyContext
  );

  let response = await callClaude(
    MERGE_PROMPT,
    [{ role: 'user', content: mergeMessage }],
    'opus'
  );

  if (!response) {
    return null;
  }

  let totalTokens = response.tokens_used;

  // Try to parse JSON
  let parsed: unknown;
  try {
    const jsonStr = extractJSON(response.response);
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Supercharged merge JSON parse failed, retrying...');

    const retryMessage = `Your previous response was not valid JSON. Return ONLY the JSON object with these exact fields:
- consensus (string)
- confidence ("high" | "medium" | "low")
- consensus_strength (number 0-100)
- gpt_overall_confidence ("high" | "medium" | "low")
- claude_overall_confidence ("high" | "medium" | "low")
- confidence_reasoning (string)
- deltas (array)
- unverified_assumptions (array of strings)
- next_steps (array of strings)
- decision_filter_notes (string)

Original request:
${mergeMessage}`;

    response = await callClaude(
      MERGE_PROMPT,
      [{ role: 'user', content: retryMessage }],
      'opus'
    );

    if (!response) return null;
    totalTokens += response.tokens_used;

    try {
      const jsonStr = extractJSON(response.response);
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('Supercharged merge JSON parse failed on retry');
      return null;
    }
  }

  return {
    result: parsed as MergeResult,
    tokens_used: totalTokens,
  };
}

/**
 * Call arbiter review using Opus model
 */
async function arbiterReviewWithOpus(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  mergeResult: MergeResult
): Promise<ArbiterOutput | null> {
  const { ARBITER_PROMPT, buildArbiterMessages } = await import('./prompts');

  const mergeResultJson = JSON.stringify(mergeResult, null, 2);
  const arbiterMessage = buildArbiterMessages(
    userQuery,
    gptResponse,
    claudeResponse,
    mergeResultJson
  );

  const response = await callClaude(
    ARBITER_PROMPT,
    [{ role: 'user', content: arbiterMessage }],
    'opus'
  );

  if (!response) return null;

  return {
    review: response.response,
    tokens_used: response.tokens_used,
  };
}

/**
 * Final synthesis pass that incorporates arbiter feedback
 */
async function finalSynthesisPass(
  userQuery: string,
  initialMerge: MergeResult,
  arbiterReview: string
): Promise<MergeOutput | null> {
  const initialMergeJson = JSON.stringify(initialMerge, null, 2);
  const synthesisMessage = buildFinalSynthesisMessages(
    userQuery,
    initialMergeJson,
    arbiterReview
  );

  const response = await callClaude(
    FINAL_SYNTHESIS_PROMPT,
    [{ role: 'user', content: synthesisMessage }],
    'opus'
  );

  if (!response) return null;

  let parsed: unknown;
  try {
    const jsonStr = extractJSON(response.response);
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Final synthesis JSON parse failed:', error);
    return null;
  }

  return {
    result: parsed as MergeResult,
    tokens_used: response.tokens_used,
  };
}
