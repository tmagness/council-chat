import { callClaude } from '../providers/anthropic';
import { ARBITER_PROMPT, buildArbiterMessages } from './prompts';

export interface ArbiterOutput {
  review: string;
  tokens_used: number;
}

export async function arbiterReview(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  consensus: string
): Promise<ArbiterOutput | null> {
  const arbiterMessage = buildArbiterMessages(
    userQuery,
    gptResponse,
    claudeResponse,
    consensus
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
