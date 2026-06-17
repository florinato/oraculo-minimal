import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json({ status: 'error', message: 'Payment ID and Transaction ID are required' }, { status: 400 });
    }

    const piNetworkApiKey = process.env.PI_NETWORK_API_KEY;
    if (!piNetworkApiKey) {
      console.error('PI_NETWORK_API_KEY is not set in environment variables');
      return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
    }

    const isSandbox = process.env.NEXT_PUBLIC_IS_SANDBOX === "true";
    const baseUrl = isSandbox ? "https://api.minepi.com/v2/sandbox" : "https://api.minepi.com/v2";
    const piApiUrl = `${baseUrl}/payments/${paymentId}/complete`;

    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piNetworkApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!piResponse.ok) {
      const errorData = await piResponse.json();
      console.error(`Error completing Pi payment ${paymentId} with txid ${txid}:`, errorData);
      return NextResponse.json({ status: 'error', message: 'Failed to complete payment with Pi Network', details: errorData }, { status: piResponse.status });
    }

    const successData = await piResponse.json();
    console.log(`Pi payment ${paymentId} completed successfully with txid ${txid}:`, successData);
    return NextResponse.json({ status: 'success', message: 'Payment completed successfully', data: successData });

  } catch (error: unknown) { // Use 'unknown' as recommended by TypeScript
    console.error('Error in payment completion API route:', (error instanceof Error ? error.message : error));
    return NextResponse.json({ status: 'error', message: 'Internal server error', details: (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
