"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { checkIsPiBrowser, initializePiSdkOnly } from "../app/lib/pi-network";
import PiDebugInfo from "./PiDebugInfo";

interface PiBrowserContextType {
  isPiEnv: boolean;
}

export const PiBrowserContext = createContext<PiBrowserContextType | undefined>(undefined);

export const usePiBrowser = () => {
  const context = useContext(PiBrowserContext);
  if (context === undefined) {
    throw new Error("usePiBrowser must be used within a PiBrowserProvider");
  }
  return context;
};

interface PiSDKProviderProps {
  children: React.ReactNode;
}

const PiSDKProvider: React.FC<PiSDKProviderProps> = ({ children }) => {
  const [isPiEnv, setIsPiEnv] = useState<boolean>(false);

  useEffect(() => {
    initializePiSdkOnly();

    const handlePiDebugUpdate = () => {
      setIsPiEnv(checkIsPiBrowser());
    };

    window.addEventListener("piDebugUpdate", handlePiDebugUpdate);
    setIsPiEnv(checkIsPiBrowser()); // Initial check

    return () => {
      window.removeEventListener("piDebugUpdate", handlePiDebugUpdate);
    };
  }, []);

  return (
    <PiBrowserContext.Provider value={{ isPiEnv }}>
      {children}
      <PiDebugInfo />
    </PiBrowserContext.Provider>
  );
};

export default PiSDKProvider;
