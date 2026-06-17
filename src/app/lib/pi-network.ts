/* eslint-disable @typescript-eslint/no-explicit-any */

export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN
const IS_SANDBOX = process.env.NEXT_PUBLIC_IS_SANDBOX === "true";
const ENABLE_ADS = false; 

/**
 * 1. DEPURACIÓN (Sincronizado con tu interfaz de checks)
 */
interface PiDebugInfo {
  isUserAgentPiBrowser?: boolean;
  isPiObjectInjected?: boolean;
  isPiNetHost?: boolean;
  piBrowserDetected?: boolean;
  sdkInitialized?: boolean;
  paymentAttempted?: boolean;
  paymentStatus?: string;
  paymentError?: string;
}

const updateDebug = (info: Partial<PiDebugInfo>) => {
  if (typeof window !== "undefined") {
    window.piDebugInfo = { ...(window.piDebugInfo || {}), ...info };
    window.dispatchEvent(new CustomEvent('piDebugUpdate'));
  }
};

/**
 * 2. DETECCIÓN (Doble comprobación para evitar el falso negativo)
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // 1. Comprobación del objeto global (la más fiable)
  const hasPiObject = !!(window as any).Pi || !!(window as any).PiNetwork;
  
  // 2. Comprobación de User Agent (patrones actualizados)
  const ua = navigator.userAgent || "";
  const uaPatterns = [
    /PiBrowser/i, 
    /Pi Network/i, 
    /Android.*Pi/i, 
    /iPhone.*Pi/i
  ];
  const isUAMatch = uaPatterns.some(pattern => pattern.test(ua));
  
  // 3. Comprobación de dominio (fallback)
  const isPinetDomain = window.location.hostname.endsWith(".pinet.com");

  // Actualizamos debug con los detalles específicos
  updateDebug({ 
    isUserAgentPiBrowser: isUAMatch,
    isPiObjectInjected: hasPiObject,
    isPiNetHost: isPinetDomain,
    piBrowserDetected: hasPiObject || isUAMatch || isPinetDomain 
  });
  
  // Si tenemos el objeto Pi o estamos en pinet.com, asumimos que es válido
  return hasPiObject || isPinetDomain;
};

/**
 * 3. CARGA Y AUTENTICACIÓN
 */
const loadPiScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || (window as any).Pi) return resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

const onIncompletePaymentFound = async (payment: any) => {
  console.log("[Pi SDK] Pago pendiente:", payment.identifier);
  try {
    await fetch("/api/pi-payment/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid }),
    });
  } catch (e) { console.error("Incomplete Payment Error:", e); }
};

/**
 * 4. FUNCIONES EXPORTADAS
 */

export const initializePiSdkOnly = async () => {
  if (!isPiBrowser()) return;
  await loadPiScript();
  try {
    const pi = (window as any).Pi;
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    updateDebug({ sdkInitialized: true });
  } catch (e) { 
    updateDebug({ sdkInitialized: true }); 
  }
};

export const createDonationPayment = async (amount: number) => {
  // Volvemos a detectar en el momento del click para capturar el objeto si ya se inyectó
  if (!isPiBrowser()) {
    alert("⚠️ Abre desde el Pi Browser oficial para realizar pagos.");
    return;
  }

  updateDebug({ paymentAttempted: true, paymentStatus: "Iniciando..." });

  try {
    await loadPiScript();
    const pi = (window as any).Pi;

    // 1. Init & Auth
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    updateDebug({ sdkInitialized: true });
    
    await pi.authenticate(["payments", "username", "wallet_address"], onIncompletePaymentFound);
    updateDebug({ paymentStatus: "Autenticado" });

    // 2. Proceso de Pago
    pi.createPayment({
      amount: amount,
      memo: "Donación Pi Arcana",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        updateDebug({ paymentStatus: "Aprobando..." });
        const res = await fetch("/api/pi-payment/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        if (res.ok) {
          updateDebug({ paymentStatus: "Aprobado. Abre Wallet." });
          await pi.openPayment(paymentId); // DESBLOQUEA LA WALLET EN EL MÓVIL
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        updateDebug({ paymentStatus: "Finalizando..." });
        const res = await fetch("/api/pi-payment/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txid }),
        });
        if (res.ok) {
          pi.payments.complete(paymentId, txid);
          updateDebug({ paymentStatus: "Éxito ✅" });
          alert("✨ ¡Gracias por tu ofrenda!");
        }
      },
      onCancel: (paymentId: string) => {
        updateDebug({ paymentStatus: "Cancelado" });
        console.log("Cancelado:", paymentId);
      },
      onError: (error: Error) => {
        updateDebug({ paymentStatus: "Error", paymentError: error.message });
        alert("Error Wallet: " + error.message);
      },
    });

  } catch (err: any) {
    updateDebug({ paymentStatus: "Fallo", paymentError: err.message });
    console.error("Error flujo Pi:", err);
  }
};

export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;
  await loadPiScript();
  const pi = (window as any).Pi;
  if (!pi?.Ads) return;
  try {
    await pi.Ads.showAd("interstitial");
  } catch (e) { console.error("Error Ad:", e); }
};