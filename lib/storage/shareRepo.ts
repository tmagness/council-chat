import { nanoid } from 'nanoid';
import { prisma } from './db';

export async function createShareToken(threadId: string): Promise<string> {
  // Generate a 12-character URL-safe token
  const token = nanoid(12);

  await prisma.shareToken.create({
    data: {
      threadId,
      token,
    },
  });

  return token;
}

export async function getThreadByShareToken(token: string) {
  const shareToken = await prisma.shareToken.findUnique({
    where: { token },
    include: {
      thread: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  return shareToken?.thread ?? null;
}
