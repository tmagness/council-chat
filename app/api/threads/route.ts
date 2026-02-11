import { NextResponse } from 'next/server';
import { createThread } from '@/lib/storage/threadsRepo';

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
