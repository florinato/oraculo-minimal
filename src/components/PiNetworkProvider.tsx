"use client";

import { useEffect, useState } from "react";
import {
  initPiNetwork,
  authenticateUser,
  getCurrentUser,
  type PiUser,
} from "@/app/lib/pi-network";

export default function PiNetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [piUser, setPiUser] = useState<PiUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePi = async () => {
      try {
        setIsLoading(true);
        // Inicializar Pi Network con configuración sandbox para desarrollo
        await initPiNetwork({ sandbox: true });
        setIsInitialized(true);

        // Intentar obtener el usuario actual
        const user = await getCurrentUser();
        if (user) {
          setPiUser(user);
          console.log("[v0] Pi Network usuario actual:", user);
        }
      } catch (error) {
        console.error("[v0] Error inicializando Pi Network:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePi();
  }, []);

  return (
    <>
      {children}
      {/* Script de Pi Network cargado dinámicamente */}
    </>
  );
}
