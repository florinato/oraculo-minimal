"use client";

import React, { useEffect, useState } from "react";

interface PiDebugInfoType {
  isUserAgentPiBrowser?: boolean;
  isPiObjectInjected?: boolean;
  isPiNetHost?: boolean;
  piBrowserDetected?: boolean;
  sdkInitialized?: boolean;
  sdkError?: string;
  paymentAttempted?: boolean;
  paymentStatus?: string;
  paymentError?: string;
}

declare global {
  interface Window {
    piDebugInfo?: PiDebugInfoType;
  }
}

const PiDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<PiDebugInfoType | null>(null);

  useEffect(() => {
    const updateDebugInfo = () => {
      if (typeof window !== "undefined" && window.piDebugInfo) {
        setDebugInfo({ ...window.piDebugInfo });
      }
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!debugInfo) {
    return null;
  }

  const style: React.CSSProperties = {
    position: "fixed",
    bottom: "10px",
    left: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "8px",
    borderRadius: "5px",
    fontSize: "10px",
    zIndex: 9999,
    maxHeight: "150px",
    overflowY: "auto",
    width: "200px",
    pointerEvents: "none",
  };

  return (
    <div style={style}>
      <strong>Pi Debug Info:</strong>
      {debugInfo.piBrowserDetected !== undefined && (
        <p>Browser Detectado: {debugInfo.piBrowserDetected ? "Sí ✅" : "No ❌"}</p>
      )}
      {debugInfo.isUserAgentPiBrowser !== undefined && (
        <p>UA PiBrowser: {debugInfo.isUserAgentPiBrowser ? "Sí" : "No"}</p>
      )}
      {debugInfo.isPiObjectInjected !== undefined && (
        <p>window.Pi Inyectado: {debugInfo.isPiObjectInjected ? "Sí" : "No"}</p>
      )}
      {debugInfo.isPiNetHost !== undefined && (
        <p>Host PiNet: {debugInfo.isPiNetHost ? "Sí" : "No"}</p>
      )}
      {debugInfo.sdkInitialized !== undefined && (
        <p>SDK Inicializado: {debugInfo.sdkInitialized ? "Sí ✅" : "No ❌"}</p>
      )}
      {debugInfo.sdkError && (
        <p style={{ color: "red" }}>SDK Error: {debugInfo.sdkError}</p>
      )}
      {debugInfo.paymentAttempted !== undefined && (
        <p>Pago Intentado: {debugInfo.paymentAttempted ? "Sí" : "No"}</p>
      )}
      {debugInfo.paymentStatus && (
        <p>Estado Pago: {debugInfo.paymentStatus}</p>
      )}
      {debugInfo.paymentError && (
        <p style={{ color: "red" }}>Error Pago: {debugInfo.paymentError}</p>
      )}
      <p style={{ marginTop: "5px", color: "lightgray" }}>Debug visible (solo para depuración).</p>
    </div>
  );
};

export default PiDebugInfo;