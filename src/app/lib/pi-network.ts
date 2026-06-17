/* eslint-disable @typescript-eslint/no-explicit-any */

export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN
const IS_SANDBOX = true; 
const ENABLE_ADS = false; // Cambiar a true en Mainnet

/**
 * 1. DEPURACIÓN (Mantenemos los logs para el cliente)
 */
interface PiDebugInfo {
  browserDetected?: boolean;
  uaDetected?: boolean;
  piObjectInjected?: boolean;
  sdkInitialized?: boolean;
  paymentAttempted?: boolean;
}

const updateDebug = (info: Partial<PiDebugInfo>) => {
  if (typeof window !== "undefined") {
    window.piDebugInfo = { ...(window.piDebugInfo || {}), ...info };
  }
};

/**
 * 2. DETECCIÓN
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isUA = /PiBrowser/i.test(ua);
  const isObj = !!(window as any).Pi;
  
  updateDebug({ 
    browserDetected: isUA || isObj, 
    uaDetected: isUA, 
    piObjectInjected: isObj 
  });
  
  return isUA || isObj || window.location.host.includes('pinet.com');
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
  console.log("[Pi SDK] Cerrando pago pendiente...", payment.identifier);
  try {
    await fetch("/api/pi-payment/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid }),
    });
  } catch (e) { console.error(e); }
};

/**
 * 4. FUNCIONES EXPORTADAS (Las que usas en tus componentes)
 */

// Inicialización silenciosa (para el layout o inicio)
export const initializePiSdkOnly = async () => {
  if (!isPiBrowser()) return;
  await loadPiScript();
  try {
    await (window as any).Pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    updateDebug({ sdkInitialized: true });
  } catch (e) { updateDebug({ sdkInitialized: true }); }
};

// Lógica de Anuncios
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;
  await loadPiScript();
  const pi = (window as any).Pi;
  if (!pi?.Ads) return;
  try {
    await pi.Ads.showAd("interstitial");
  } catch (e) { console.error("Error Ad:", e); }
}

// Función Maestra de Pagos (Donación)
export const createDonationPayment = async (amount: number) => {
  if (!isPiBrowser()) {
    alert("⚠️ Abre desde el Pi Browser oficial.");
    return;
  }

  updateDebug({ paymentAttempted: true });

  try {
    await loadPiScript();
    const pi = (window as any).Pi;

    // Aseguramos init y login
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    await pi.authenticate(["payments", "username", "wallet_address"], onIncompletePaymentFound);

    pi.createPayment({
      amount: amount,
      memo: "Donación para Pi Arcana",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        const res = await fetch("/api/pi-payment/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        if (res.ok) pi.payments.approve(paymentId); // DESBLOQUEA LA WALLET
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const res = await fetch("/api/pi-payment/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txid }),
        });
        if (res.ok) {
          pi.payments.complete(paymentId, txid);
          alert("✨ ¡Gracias por tu ofrenda!");
        }
      },
      onCancel: (paymentId: string) => console.log("Cancelado:", paymentId),
      onError: (error: Error) => alert("Error Wallet: " + error.message),
    });

  } catch (err) {
    console.error("Error flujo Pi:", err);
  }
};