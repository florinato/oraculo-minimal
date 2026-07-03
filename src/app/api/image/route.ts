import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  
  if (!cardId) {
    return new NextResponse("Missing cardId", { status: 400 });
  }
  
  const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
  const IMG_TOKEN = process.env.NEXT_PUBLIC_IMAGE_SERVER_TOKEN;
  
  if (!ASSETS_URL) {
    console.error("[Image API] NEXT_PUBLIC_ASSETS_URL is not configured on the server");
    return new NextResponse("Server configuration error", { status: 500 });
  }
  
  const targetUrl = `${ASSETS_URL.replace(/\/$/, "")}/media/card/${cardId}?token=${IMG_TOKEN || ""}`;
  
  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      console.error(`[Image API] Failed to fetch image from target ${targetUrl}: status ${response.status}`);
      return new NextResponse("Image not found", { status: response.status });
    }
    
    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Image API] Error fetching image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
