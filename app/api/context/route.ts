import { NextRequest, NextResponse } from 'next/server';
import { getProjectContext, setProjectContext } from '@/lib/storage/configRepo';

export async function GET() {
  try {
    const context = await getProjectContext();
    return NextResponse.json({ context });
  } catch (error) {
    console.error('Failed to get project context:', error);
    return NextResponse.json(
      { error: 'Failed to get project context' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (typeof context !== 'string') {
      return NextResponse.json(
        { error: 'Context must be a string' },
        { status: 400 }
      );
    }

    await setProjectContext(context);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save project context:', error);
    return NextResponse.json(
      { error: 'Failed to save project context' },
      { status: 500 }
    );
  }
}
