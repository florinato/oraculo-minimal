import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_CHAT_API_URL; 
  const authToken = process.env.FRONTEND_API_SECRET;

  console.log("[v0] === CHAT API DEBUG ===");
  console.log("[v0] All env vars:", Object.keys(process.env).filter(k => k.includes('CHAT') || k.includes('API') || k.includes('FRONTEND') || k.includes('ASSETS')));
  console.log("[v0] Backend URL:", backendBaseUrl);
  console.log("[v0] Auth Token presente:", !!authToken);
  console.log("[v0] NODE_ENV:", process.env.NODE_ENV);

  try {
    const body = await req.json();
    console.log("[v0] Body recibido:", JSON.stringify(body).substring(0, 200));

    if (!backendBaseUrl) {
      console.error("[v0] ERROR CRÍTICO: NEXT_PUBLIC_CHAT_API_URL no está configurada");
      return NextResponse.json(
        { error: "Backend URL not configured (NEXT_PUBLIC_CHAT_API_URL)" },
        { status: 500 }
      );
    }

    // Nuevo endpoint para la API v2.0 de Pi App
    const targetUrl = `${backendBaseUrl?.replace(/\/$/, '')}/api/pi/interpretar`;
    console.log("[v0] URL destino:", targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Token': authToken?.trim() || ""
      },
      body: JSON.stringify({
        ...body,
        "knowledge_base_id": "none"
      })
    });

    console.log("[v0] Respuesta status:", response.status);
    console.log("[v0] Respuesta headers:", {
      contentType: response.headers.get('content-type'),
      isStream: response.headers.get('content-type')?.includes('event-stream')
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Error Backend:", response.status, errorText);
      return NextResponse.json({ error: "Error en Backend", status: response.status, details: errorText }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[v0] Error en Chat API:", message);
    console.error("[v0] Stack:", stack);
    return NextResponse.json({ error: message, type: "exception" }, { status: 500 });
  }
}
