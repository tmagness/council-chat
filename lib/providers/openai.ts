import OpenAI from 'openai';
import { ProviderResponse, HistoryMessage } from '../types';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function callGPT(
  systemPrompt: string,
  messages: HistoryMessage[]
): Promise<ProviderResponse | null> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('GPT returned empty response');
      return null;
    }

    const tokensUsed =
      (response.usage?.prompt_tokens ?? 0) +
      (response.usage?.completion_tokens ?? 0);

    return {
      response: content,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    console.error('GPT API error:', error);
    return null;
  }
}
