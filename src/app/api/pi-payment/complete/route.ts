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
      return NextResponse.json({ status: 'error', message: 'Configuración de servidor incorrecta: PI_NETWORK_API_KEY no está definida.' }, { status: 500 });
    }

    console.log(`[Pi API] Intentando completar el pago: ${paymentId} con txid: ${txid}. API Key prefijo: ${piNetworkApiKey.substring(0, 4)}... longitud: ${piNetworkApiKey.length}`);

    // The Pi Platform API base URL is always https://api.minepi.com/v2.
    // The sandbox (testnet) vs mainnet environment is determined by the Server API Key used.
    const baseUrl = "https://api.minepi.com/v2";
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
