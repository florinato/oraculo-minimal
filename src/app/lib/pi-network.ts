/* eslint-disable @typescript-eslint/no-explicit-any */

export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN
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

// ✅ DETECCIÓN ESTÁNDAR SEGÚN DOCS
export function checkIsPiBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Nivel 1: Verificación de User-Agent oficial
  const hasPiUserAgent = userAgent.includes("pibrowser") || userAgent.includes("pi-browser");
  
  // Nivel 2: Puente nativo de Android
  const hasAndroidBridge = !!(window as any).PiAndroid || !!(window as any).PiJSBridge;
  
  // Nivel 3: Puente nativo de iOS (WKWebKit Message Handlers)
  const hasIosBridge = !!(window as any).webkit?.messageHandlers?.pi || !!(window as any).webkit?.messageHandlers?.piSDK;
  
  // Nivel 4: Existencia del objeto global Pi
  const hasPiGlobal = !!(window as any).Pi;

  return hasPiUserAgent || hasAndroidBridge || hasIosBridge || hasPiGlobal;
}

export const isPiBrowser = (): boolean => {
  return checkIsPiBrowser();
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

// ✅ INICIALIZACIÓN ESTÁNDAR
export function initializePiSdk(onSuccess: () => void, onError: (err: unknown) => void) {
  const isPi = checkIsPiBrowser();
  const useSandbox = !isPi; // Si no es Pi Browser, usamos sandbox

  if ((window as any).Pi) {
    try {
      (window as any).Pi.init({ version: "2.0", sandbox: useSandbox });
      console.log(`Pi SDK inicializado correctamente (Modo Sandbox: ${useSandbox})`);
      updateDebug({ sdkInitialized: true, piBrowserDetected: isPi });
      onSuccess();
    } catch (error) {
      console.error("Error al inicializar el SDK de Pi:", error);
      updateDebug({ sdkInitialized: false, piBrowserDetected: isPi, paymentError: (error as Error).message });
      onError(error);
    }
  } else {
    console.warn("Objeto window.Pi no disponible.");
    updateDebug({ sdkInitialized: false, piBrowserDetected: isPi, paymentError: "Pi SDK no inyectado" });
    onError(new Error("Pi SDK no inyectado"));
  }
}

// ✅ FLUJO DE PAGO ESTÁNDAR (Docs v2)
export const createDonationPayment = async (amount: number) => {
  if (!isPiBrowser()) {
    throw new Error("⚠️ Abre desde el Pi Browser oficial para realizar pagos.");
  }

  const pi = (window as any).Pi;
  updateDebug({ paymentAttempted: true, paymentStatus: "Iniciando..." });

  try {
    // 1. Auth (requerido antes de payments)
    await pi.authenticate(["payments", "username", "wallet_address"], onIncompletePaymentFound);
    updateDebug({ paymentStatus: "Autenticado" });

    // 2. Create Payment
    pi.createPayment({
      amount: amount,
      memo: "Donación Pi Arcana",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        updateDebug({ paymentStatus: "Aprobando servidor..." });
        const res = await fetch("/api/pi-payment/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        
        if (res.ok) {
          // ✅ ABIERTURA DE WALLET (Método estándar v2)
          await pi.openPayment(paymentId); 
          updateDebug({ paymentStatus: "Wallet abierta" });
        } else {
          throw new Error("Fallo aprobación servidor");
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        updateDebug({ paymentStatus: "Completando..." });
        const res = await fetch("/api/pi-payment/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txid }),
        });
        
        if (res.ok) {
          await pi.completePayment(paymentId, txid);
          updateDebug({ paymentStatus: "Éxito ✅" });
        }
      },
      onCancel: (_paymentId: string) => {
        updateDebug({ paymentStatus: "Cancelado por usuario" });
      },
      onError: (error: Error, _paymentId?: string) => {
        updateDebug({ paymentStatus: "Error", paymentError: error.message });
        console.error("[Pi SDK Error]", error, _paymentId);
      },
    });
  } catch (err: any) {
    updateDebug({ paymentStatus: "Fallo crítico", paymentError: err.message });
  }
};

export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;
  const pi = (window as any).Pi;
  if (!pi?.Ads) return;
  try {
    await pi.Ads.showAd("interstitial");
  } catch (e) { console.error("Error Ad:", e); }
};
