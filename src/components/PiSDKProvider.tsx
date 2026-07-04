"use client";

import Script from "next/script";
import React, { createContext, useContext, useEffect, useState } from "react";
import { checkIsPiBrowser, initializePiSdk } from "../app/lib/pi-network";

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
    // The Pi SDK script is loaded via next/script and initializePiSdk handles polling

    const handlePiDebugUpdate = () => {
      setIsPiEnv(checkIsPiBrowser());
    };

    initializePiSdk(
      () => {
        // Success callback, ensure isPiEnv is updated after successful initialization
        setIsPiEnv(checkIsPiBrowser());
      },
      (error: unknown) => {
        console.error("Error during Pi SDK initialization in provider:", (error as Error).message);
        // Even on error, update isPiEnv based on browser detection
        setIsPiEnv(checkIsPiBrowser());
      }
    );

    window.addEventListener("piDebugUpdate", handlePiDebugUpdate);
    
    return () => {
      window.removeEventListener("piDebugUpdate", handlePiDebugUpdate);
    };
  }, []);

  return (
    <PiBrowserContext.Provider value={{ isPiEnv }}>
      <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
      {children}
    </PiBrowserContext.Provider>
  );
};

export default PiSDKProvider;
