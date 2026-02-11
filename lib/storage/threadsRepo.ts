import { prisma } from './db';
import { HistoryMessage, MergeResult } from '../types';

export async function createThread(): Promise<string> {
  const thread = await prisma.thread.create({
    data: {},
  });
  return thread.id;
}

export async function getThread(threadId: string) {
  return prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export interface AddMessageData {
  role: 'user' | 'assistant';
  content: string;
  gptResponse?: string | null;
  claudeResponse?: string | null;
  mergeResult?: MergeResult | null;
  arbiterReview?: string | null;
  mode: string;
  tokensUsed: number;
  estimatedCost: number;
}

export async function addMessage(threadId: string, data: AddMessageData) {
  return prisma.message.create({
    data: {
      threadId,
      role: data.role,
      content: data.content,
      gptResponse: data.gptResponse ?? null,
      claudeResponse: data.claudeResponse ?? null,
      mergeResult: data.mergeResult ? JSON.stringify(data.mergeResult) : null,
      arbiterReview: data.arbiterReview ?? null,
      mode: data.mode,
      tokensUsed: data.tokensUsed,
      estimatedCost: data.estimatedCost,
    },
  });
}

// Returns user messages + consensus only (for blind independence)
export async function getThreadHistory(threadId: string): Promise<HistoryMessage[]> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!thread) return [];

  const history: HistoryMessage[] = [];

  for (const msg of thread.messages) {
    if (msg.role === 'user') {
      history.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      // Only include consensus, never raw model responses
      history.push({ role: 'assistant', content: msg.content });
    }
  }

  return history;
}
