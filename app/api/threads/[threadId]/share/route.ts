import { NextRequest, NextResponse } from 'next/server';
import { getThread } from '@/lib/storage/threadsRepo';
import { createShareToken } from '@/lib/storage/shareRepo';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    // Verify thread exists
    const thread = await getThread(threadId);
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Create share token
    const token = await createShareToken(threadId);

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://council-chat-roan.vercel.app';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({ share_url: shareUrl });
  } catch (error) {
    console.error('Failed to create share token:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
