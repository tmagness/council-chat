import { ProviderResponse, HistoryMessage, ImageAttachment } from '../types';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface OpenAIResponse {
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string };
}

function buildMessageContent(text: string, images?: ImageAttachment[]): string | ContentPart[] {
  if (!images || images.length === 0) {
    return text;
  }

  const parts: ContentPart[] = [{ type: 'text', text }];

  for (const img of images) {
    parts.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.media_type};base64,${img.data}`,
      },
    });
  }

  return parts;
}

export async function callGPT(
  systemPrompt: string,
  messages: HistoryMessage[]
): Promise<ProviderResponse | null> {
  try {
    const apiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: buildMessageContent(m.content, m.images),
      })),
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const data: OpenAIResponse = await res.json();

    if (!res.ok) {
      console.error('GPT API error:', data.error?.message);
      return null;
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      console.error('GPT returned empty response');
      return null;
    }

    const tokensUsed =
      (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0);

    return {
      response: content,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    console.error('GPT API error:', error);
    return null;
  }
}
