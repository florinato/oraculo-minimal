"use client";

import React, { useEffect } from "react";
import { initializePiSdkOnly } from "../app/lib/pi-network";

interface PiSDKProviderProps {
  children: React.ReactNode;
}

const PiSDKProvider: React.FC<PiSDKProviderProps> = ({ children }) => {
  useEffect(() => {
    initializePiSdkOnly();
  }, []);

  return <>{children}</>;
};

export default PiSDKProvider;
