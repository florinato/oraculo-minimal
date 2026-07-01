"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { checkIsPiBrowser, initializePiSdk } from "../app/lib/pi-network";
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
    // The Pi SDK script is now loaded synchronously in layout.tsx

    const handlePiDebugUpdate = () => {
      setIsPiEnv(checkIsPiBrowser());
    };

    // Initial check and SDK initialization
    setIsPiEnv(checkIsPiBrowser());
    initializePiSdk(
      () => {},
      (error: unknown) => {
        console.error("Error during Pi SDK initialization in provider:", (error as Error).message);
      }
    );

    window.addEventListener("piDebugUpdate", handlePiDebugUpdate);
    
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
