import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ status: 'error', message: 'Payment ID is required' }, { status: 400 });
    }

    const piNetworkApiKey = process.env.PI_NETWORK_API_KEY;
    if (!piNetworkApiKey) {
      console.error('PI_NETWORK_API_KEY is not set in environment variables');
      return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
    }

    const isSandbox = process.env.NEXT_PUBLIC_IS_SANDBOX === "true";
    const baseUrl = isSandbox ? "https://api.minepi.com/v2/sandbox" : "https://api.minepi.com/v2";
    const piApiUrl = `${baseUrl}/payments/${paymentId}/approve`;

    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piNetworkApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piResponse.ok) {
      const errorData = await piResponse.json();
      console.error(`Error approving Pi payment ${paymentId}:`, errorData);
      return NextResponse.json({ status: 'error', message: 'Failed to approve payment with Pi Network', details: errorData }, { status: piResponse.status });
    }

    const successData = await piResponse.json();
    console.log(`Pi payment ${paymentId} approved successfully:`, successData);
    return NextResponse.json({ status: 'success', message: 'Payment approved successfully', data: successData });

  } catch (error: unknown) { // Use 'unknown' as recommended by TypeScript
    console.error('Error in payment approval API route:', (error instanceof Error ? error.message : error)); // Log message or the unknown error
    return NextResponse.json({ status: 'error', message: 'Internal server error', details: (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
