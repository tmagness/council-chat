import { NextResponse } from 'next/server';
import { createThread, listThreads } from '@/lib/storage/threadsRepo';

export async function GET() {
  try {
    const threads = await listThreads();
    return NextResponse.json({
      threads: threads.map((t) => ({
        id: t.id,
        created_at: t.createdAt,
        first_message: t.messages[0]?.content?.slice(0, 50) || '',
      })),
    });
  } catch (error) {
    console.error('Failed to list threads:', error);
    return NextResponse.json(
      { error: 'Failed to list threads' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const threadId = await createThread();
    return NextResponse.json({ thread_id: threadId });
  } catch (error) {
    console.error('Failed to create thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
