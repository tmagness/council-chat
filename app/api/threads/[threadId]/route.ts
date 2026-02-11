import { NextRequest, NextResponse } from 'next/server';
import { getThread } from '@/lib/storage/threadsRepo';
import { MergeResult } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const thread = await getThread(threadId);

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Parse stored JSON fields
    const messages = thread.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      gpt_response: msg.gptResponse,
      claude_response: msg.claudeResponse,
      merge_result: msg.mergeResult
        ? (JSON.parse(msg.mergeResult) as MergeResult)
        : null,
      arbiter_review: msg.arbiterReview,
      mode: msg.mode,
      estimated_cost: `$${msg.estimatedCost.toFixed(4)}`,
      created_at: msg.createdAt,
    }));

    return NextResponse.json({
      thread_id: thread.id,
      created_at: thread.createdAt,
      messages,
    });
  } catch (error) {
    console.error('Failed to get thread:', error);
    return NextResponse.json(
      { error: 'Failed to get thread' },
      { status: 500 }
    );
  }
}
