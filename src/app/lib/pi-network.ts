/* eslint-disable @typescript-eslint/no-explicit-any */

export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN DE RED Y UTILIDADES
const IS_SANDBOX = true; // true = Testnet (Pi de prueba) | false = Mainnet (Pi Real)
const ENABLE_ADS = false; // true = Activar anuncios | false = Desactivar

/**
 * Detección fiable del Pi Browser
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  const globalWindow = window as any;
  const ua = navigator.userAgent || "";
  
  // Verificamos UserAgent, el objeto Pi inyectado o si estamos en PiNet
  return (
    /PiBrowser/i.test(ua) || 
    !!globalWindow.Pi || 
    window.location.host.includes('pinet.com')
  );
};

/**
 * Carga el script oficial del SDK
 */
const loadPiScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || (window as any).Pi) return resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("No se pudo cargar el SDK de Pi");
      resolve();
    };
    document.head.appendChild(script);
  });
};

/**
 * Inicialización y Autenticación (El "Logueo" interno de Pi)
 */
async function authenticateWithPi(): Promise<any> {
  const pi = (window as any).Pi;
  if (!pi) throw new Error("SDK no disponible");

  // 1. Inicializar (Aquí se decide la RED)
  try {
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    console.log(`[Pi SDK] Red: ${IS_SANDBOX ? "TESTNET" : "MAINNET"}`);
  } catch (e) {
    // Ya estaba inicializado
  }

  // 2. Autenticar (Pide permiso de lectura de usuario y pagos)
  const scopes = ["payments"];
  const onIncompletePaymentFound = (payment: any) => {
    console.log("Pago pendiente hallado:", payment);
    // Nota: Aquí se debería avisar al servidor para completar el pago si es necesario
  };

  return await pi.authenticate(scopes, onIncompletePaymentFound);
}

/**
 * Función principal para crear el pago (Donación)
 */
export const createDonationPayment = async (amount: number) => {
  // Comprobación de seguridad inicial
  if (!isPiBrowser()) {
    alert("⚠️ Para operar con $Pi, abre la App desde el navegador de Pi Network.");
    return;
  }

  try {
    await loadPiScript();
    
    // Paso obligatorio: Autenticar para que Pi abra la Wallet
    console.log("[Pi] Autenticando...");
    await authenticateWithPi();

    const pi = (window as any).Pi;

    // Lanzar el pago
    console.log("[Pi] Abriendo Wallet para:", amount);
    pi.createPayment({
      amount: amount,
      memo: "Donación Pi Arcana",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("[Pi] Pago creado. ID de transacción:", paymentId);
        // En Testnet la wallet se abre aquí aunque no tengas backend de aprobación.
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi] Éxito. TXID:", txid);
        alert("✨ ¡Gracias por tu ofrenda! El destino te favorece.");
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi] Usuario canceló el pago:", paymentId);
      },
      onError: (error: Error, payment: any) => {
        console.error("[Pi] Error en la Wallet:", error.message);
        if (payment) console.log("Datos del fallo:", payment);
      },
    });

  } catch (err: any) {
    console.error("[Pi] Error crítico:", err);
    alert("Reintenta pulsar el botón para conectar con tu Pi Wallet.");
  }
};

/**
 * Muestra anuncios (Solo si están habilitados)
 */
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;
  await loadPiScript();
  const pi = (window as any).Pi;
  if (!pi?.Ads) return;

  try {
    await pi.Ads.showAd("interstitial");
  } catch (e) {
    console.error("Error al mostrar anuncio:", e);
  }
}