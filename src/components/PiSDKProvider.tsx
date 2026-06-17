"use client";

import React, { useEffect } from "react";
import { initializePiSdkOnly } from "../app/lib/pi-network";
import PiDebugInfo from "./PiDebugInfo";

interface PiSDKProviderProps {
  children: React.ReactNode;
}

const PiSDKProvider: React.FC<PiSDKProviderProps> = ({ children }) => {
  useEffect(() => {
    // Esperamos un tick para asegurar que window.Pi exista si fue inyectado por el navegador
    const timer = setTimeout(() => {
      initializePiSdkOnly();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <PiDebugInfo />
    </>
  );
};

export default PiSDKProvider;
