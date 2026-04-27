import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_CHAT_API_URL; 
  const authToken = process.env.FRONTEND_API_SECRET;

  try {
    const body = await req.json();

    // 1. RUTA EXACTA según tu test_api.py: /api/interpretar
    const targetUrl = `${backendBaseUrl?.replace(/\/$/, '')}/api/interpretar`;

    console.log(">>> [PROXY] Llamando a:", targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Token': authToken?.trim() || "" // "mi_token_super_secreto_123"
      },
      body: JSON.stringify({
        ...body,
        "knowledge_base_id": "none"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(">>> [PROXY] Error Backend:", response.status, errorText);
      return NextResponse.json({ error: "Error en Backend", status: response.status }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    // TypeScript prefiere que tratemos el error como 'unknown' o 'Error'
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error(">>> [PROXY] Error Crítico:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
