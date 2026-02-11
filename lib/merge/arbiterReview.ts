import { callClaude } from '../providers/anthropic';
import { MergeResult } from '../types';
import { ARBITER_PROMPT, buildArbiterMessages } from './prompts';

export interface ArbiterOutput {
  review: string;
  tokens_used: number;
}

/**
 * Run arbiter review on the merged decision artifact.
 * The arbiter's job is to attack the synthesis and identify weaknesses.
 */
export async function arbiterReview(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  mergeResult: MergeResult
): Promise<ArbiterOutput | null> {
  // Pass the full merge result as JSON so arbiter can review all fields
  const mergeResultJson = JSON.stringify(mergeResult, null, 2);

  const arbiterMessage = buildArbiterMessages(
    userQuery,
    gptResponse,
    claudeResponse,
    mergeResultJson
  );

  const response = await callClaude(ARBITER_PROMPT, [
    { role: 'user', content: arbiterMessage },
  ]);

  if (!response) {
    console.error('Arbiter call failed');
    return null;
  }

  return {
    review: response.response,
    tokens_used: response.tokens_used,
  };
}
