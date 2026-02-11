import { NextRequest, NextResponse } from 'next/server';
import { getThreadByShareToken } from '@/lib/storage/shareRepo';
import { MergeResult } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const thread = await getThreadByShareToken(token);

    if (!thread) {
      return NextResponse.json(
        { error: 'Shared thread not found' },
        { status: 404 }
      );
    }

    // Parse stored JSON fields (same format as /api/threads/[threadId])
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
    console.error('Failed to get shared thread:', error);
    return NextResponse.json(
      { error: 'Failed to get shared thread' },
      { status: 500 }
    );
  }
}
