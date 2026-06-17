import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[CLIENT DEBUG LOG]:", body);
    return NextResponse.json({ status: 'success', message: 'Log received' });
  } catch (error) {
    console.error("[CLIENT DEBUG LOG ERROR]:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to process log' }, { status: 500 });
  }
}
