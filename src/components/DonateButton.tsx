"use client";

import { createDonationPayment } from "@/app/lib/pi-network";
import React, { useState } from "react";
import { usePiBrowser } from "../components/PiSDKProvider";

interface DonateButtonProps {
  amount: number;
  buttonText: string;
  className?: string; // Add className prop
}

const DonateButton: React.FC<DonateButtonProps> = ({ amount, buttonText, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPiEnv } = usePiBrowser();

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await createDonationPayment(amount);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al procesar el pago";
      setError(errorMessage);
      console.error("Error en DonateButton:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}> {/* Apply className here */}
      {!isPiEnv && (
        <div style={{ backgroundColor: "#282828", color: "#E5C158", padding: "8px", marginBottom: "10px", textAlign: "center", fontSize: "12px", borderRadius: "5px" }}>
          ⚠️ Para realizar pagos reales con Pi, por favor abre esta aplicación dentro del <strong>Pi Browser</strong>.
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isLoading || !isPiEnv}
        style={{
          backgroundColor: isLoading || !isPiEnv ? "#A68F5E" : "black",
          border: "1px solid #E5C158",
          color: "#E5C158",
          textTransform: "uppercase",
          fontFamily: "serif",
          padding: "5px 20px",
          cursor: isLoading || !isPiEnv ? "not-allowed" : "pointer",
          borderRadius: "5px",
          opacity: isLoading || !isPiEnv ? 0.6 : 1,
          transition: "all 0.3s ease",
        }}
      >
        {isLoading ? "Procesando..." : buttonText}
      </button>
      {error && (
        <div style={{ color: "#ff6b6b", fontSize: "12px", marginTop: "8px" }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default DonateButton;
