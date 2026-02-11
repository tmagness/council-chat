import { ProviderResponse, HistoryMessage, ImageAttachment } from '../types';

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  usage: { input_tokens: number; output_tokens: number };
  error?: { message: string };
}

function buildMessageContent(text: string, images?: ImageAttachment[]): string | ContentBlock[] {
  if (!images || images.length === 0) {
    return text;
  }

  const blocks: ContentBlock[] = [];

  // Images first, then text (Claude prefers this order)
  for (const img of images) {
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.media_type,
        data: img.data,
      },
    });
  }

  blocks.push({ type: 'text', text });

  return blocks;
}

export async function callClaude(
  systemPrompt: string,
  messages: HistoryMessage[]
): Promise<ProviderResponse | null> {
  try {
    const apiMessages: AnthropicMessage[] = messages.map((m) => ({
      role: m.role,
      content: buildMessageContent(m.content, m.images),
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    const data: AnthropicResponse = await res.json();

    if (!res.ok) {
      console.error('Claude API error:', data.error?.message);
      return null;
    }

    const textBlock = data.content?.find((block) => block.type === 'text');
    if (!textBlock) {
      console.error('Claude returned no text content');
      return null;
    }

    const tokensUsed =
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    return {
      response: textBlock.text,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}
