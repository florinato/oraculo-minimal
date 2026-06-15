"use client";

import { initializePiSdkAndAuthenticate } from "@/app/lib/pi-network";
import { useEffect } from "react";

export default function PiNetworkInitializer() {
  useEffect(() => {
    // Cargar Pi Network cuando la app se monta
    console.log("[v0] Inicializando y autenticando Pi Network en background...");
    initializePiSdkAndAuthenticate().catch((error) => {
      console.error("[v0] Error al inicializar y autenticar Pi Network:", error);
    });
  }, []);

  return null;
}
