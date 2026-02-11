import Anthropic from '@anthropic-ai/sdk';
import { ProviderResponse, HistoryMessage } from '../types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export async function callClaude(
  systemPrompt: string,
  messages: HistoryMessage[]
): Promise<ProviderResponse | null> {
  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error('Claude returned no text content');
      return null;
    }

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) +
      (response.usage?.output_tokens ?? 0);

    return {
      response: textBlock.text,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}
