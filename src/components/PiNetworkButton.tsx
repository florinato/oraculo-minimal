"use client";

import { useState } from "react";
import { authenticateUser, type PiUser } from "@/app/lib/pi-network";

export default function PiNetworkButton() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const authenticatedUser = await authenticateUser();
      if (authenticatedUser) {
        setUser(authenticatedUser);
        console.log("[v0] Usuario conectado con Pi Network:", authenticatedUser);
      } else {
        setError("No se pudo autenticar con Pi Network");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
      console.error("[v0] Error conectando a Pi Network:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E5C158]/10 border border-[#E5C158]/50 text-[#E5C158]">
        <div className="w-2 h-2 rounded-full bg-[#E5C158]" />
        <span className="text-sm font-semibold">
          {user.firstName} {user.lastName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="px-6 py-2 rounded-lg bg-[#E5C158] text-[#100C1A] font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E5C158]/90 active:scale-95"
      >
        {isLoading ? "Conectando..." : "Conectar Pi Network"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
