import { NextRequest, NextResponse } from "next/server";

const PI_API_KEY = process.env.PI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, isSimulated } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId es requerido" },
        { status: 400 }
      );
    }

    // Si es simulado o no tenemos API Key, solo respondemos OK
    if (isSimulated || !PI_API_KEY || PI_API_KEY.includes("TU_")) {
      console.log(`[Backend Sandbox] Aprobando pago ${paymentId} de forma simulada`);
      return NextResponse.json({
        success: true,
        message: "Aprobación simulada",
        paymentId
      });
    }

    // Llamar a la API real de Pi Network
    console.log(`[Backend Real] Aprobando pago en Pi API: ${paymentId}`);

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Pi API Error] Status ${response.status}:`, errorText);
      return NextResponse.json(
        { success: false, error: `Pi API: ${errorText}` },
        { status: response.status }
      );
    }

    const piData = await response.json();
    console.log("[Backend Real] Pago aprobado en Pi:", piData);

    return NextResponse.json({
      success: true,
      data: piData
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Backend Error] Exception en approve:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
