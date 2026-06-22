import { NextRequest, NextResponse } from "next/server";

const PI_API_KEY = process.env.PI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid, isSimulated } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: "paymentId y txid son requeridos" },
        { status: 400 }
      );
    }

    // Si es simulado o no tenemos API Key, solo respondemos OK
    if (isSimulated || !PI_API_KEY || PI_API_KEY.includes("TU_")) {
      console.log(`[Backend Sandbox] Marcando como completado: ${paymentId}`);
      // Aquí podrías guardar en la base de datos que la donación fue completada
      // DB.saveDonation({ paymentId, txid, status: "completed" })
      return NextResponse.json({
        success: true,
        message: "Completación simulada",
        paymentId,
        txid
      });
    }

    // Llamar a la API real de Pi Network
    console.log(`[Backend Real] Completando pago en Pi API: ${paymentId}`);

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_API_KEY}`
      },
      body: JSON.stringify({ txid })
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
    console.log("[Backend Real] Pago completado en Pi:", piData);

    // ✅ AQUÍ ES DONDE DEBES GUARDAR EN TU BASE DE DATOS
    // Ejemplo:
    // await DB.saveDonation({
    //   paymentId,
    //   txid,
    //   amount: piData.amount,
    //   status: "completed",
    //   createdAt: new Date()
    // });

    return NextResponse.json({
      success: true,
      data: piData
    });
  } catch (error: any) {
    console.error("[Backend Error] Exception en complete:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
