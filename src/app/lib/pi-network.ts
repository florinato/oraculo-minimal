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
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  // En pinet.com, window.Pi siempre existe si la app está bien configurada en Developer Portal
  return !!(window as any).Pi; 
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
  if (!isPiBrowser()) return;
  
  const pi = (window as any).Pi;
  
  // Solo init si no está ya inicializado (evita errores de doble init)
  try {
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    updateDebug({ sdkInitialized: true });
  } catch (e) {
    console.warn("[Pi SDK] Ya inicializado o error:", e);
    updateDebug({ sdkInitialized: true }); // Asumimos ok si falla por ya-init
  }
};

// ✅ FLUJO DE PAGO ESTÁNDAR (Docs v2)
export const createDonationPayment = async (amount: number) => {
  if (!isPiBrowser()) {
    alert("⚠️ Abre desde el Pi Browser oficial para realizar pagos.");
    return;
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
