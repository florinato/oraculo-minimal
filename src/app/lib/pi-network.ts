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

// ✅ DETECCIÓN ESTÁNDAR SEGÚN DOCS
export const checkIsPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  // 1. Detección tradicional por cadena de agente de usuario
  const hasPiUserAgent = userAgent.includes("pibrowser") || userAgent.includes("pi-browser");

  // 2. Detección por puente nativo de Android
  const hasAndroidBridge = !!(window as any).PiAndroid || !!(window as any).PiJSBridge;

  // 3. Detección por puente nativo de iOS (WebKit)
  const hasIosBridge = !!(window as any).webkit?.messageHandlers?.pi || 
                        !!(window as any).webkit?.messageHandlers?.piSDK;

  return hasPiUserAgent || hasAndroidBridge || hasIosBridge;
};

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
export const initializePiSdkOnly = async () => {
  let checks = 0;
  const maxChecks = 10; // 500ms en total (10 checks * 50ms)

  const initInterval = setInterval(() => {
    checks++;
    const isPi = checkIsPiBrowser();

    if ((window as any).Pi || isPi || checks >= maxChecks) {
      clearInterval(initInterval);
      
      if ((window as any).Pi) {
        const sandboxMode = !isPi;
        (window as any).Pi.init({ version: "2.0", sandbox: sandboxMode });
        updateDebug({ sdkInitialized: true, piBrowserDetected: isPi });
        console.log(`[Pi SDK] Inicializado con sandbox = ${sandboxMode}. Detectado Pi Browser: ${isPi}`);
      } else {
        updateDebug({ sdkInitialized: false, piBrowserDetected: isPi });
        console.warn("[Pi SDK] No se pudo inicializar el SDK. Pi object no disponible.");
      }
    }
  }, 50);
};

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
          alert("✨ ¡Gracias por tu ofrenda!");
        }
      },
      onCancel: (paymentId: string) => {
        updateDebug({ paymentStatus: "Cancelado por usuario" });
      },
      onError: (error: Error, paymentId?: string) => {
        updateDebug({ paymentStatus: "Error", paymentError: error.message });
        console.error("[Pi SDK Error]", error, paymentId);
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
