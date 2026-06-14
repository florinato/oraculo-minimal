"use client";

import { initializePiSdk } from "@/app/lib/pi-network";
import { useEffect } from "react";

export default function PiNetworkInitializer() {
  useEffect(() => {
    // Cargar Pi Network cuando la app se monta
    console.log("[v0] Inicializando Pi Network en background...");
    initializePiSdk().catch((error) => {
      console.error("[v0] Error al inicializar Pi Network:", error);
    });
  }, []);

  return null;
}
