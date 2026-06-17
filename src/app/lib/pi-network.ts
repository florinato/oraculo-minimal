export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN DE RED Y UTILIDADES
const IS_SANDBOX = true; // true = Testnet (Pi de prueba) | false = Mainnet (Pi Real)
const ENABLE_ADS = false; // true = Activar anuncios | false = Desactivar

// 🔄 Estado global para evitar cargas duplicadas
let piScriptLoading: Promise<void> | null = null;

// Tipo para el objeto Pi global
interface PiType {
  init: (config: { version: string; sandbox: boolean }) => Promise<void>;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void
  ) => Promise<{ scopes: string[] }>;
  createPayment: (
    paymentConfig: {
      amount: number;
      memo: string;
      metadata: { type: string };
    },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment: unknown) => void;
    }
  ) => void;
  Ads?: {
    showAd: (type: string) => Promise<void>;
  };
}

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
    Pi: PiType;
    piDebugInfo: PiDebugInfoType;
  }
}

// Inicializar piDebugInfo si no existe
if (typeof window !== "undefined") {
  window.piDebugInfo = window.piDebugInfo || {};
}

// Función para enviar logs al servidor
const sendClientDebugLog = async (logData: PiDebugInfoType | { message: string, detail?: any }) => {
  if (typeof window === "undefined") return; // Solo ejecutar en el cliente

  try {
    const response = await fetch("/api/debug-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    });
    if (!response.ok) {
      console.error("Failed to send debug log to server:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending debug log:", error);
  }
};

/**
 * Detección fiable del Pi Browser
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isUserAgentPiBrowser = /PiBrowser/i.test(ua);
  const isPiObjectInjected = !!window.Pi;
  const isPiNetHost = window.location.host.includes("pinet.com");

  // Guardar información de depuración
  if (typeof window !== "undefined" && window.piDebugInfo) {
    window.piDebugInfo.isUserAgentPiBrowser = isUserAgentPiBrowser;
    window.piDebugInfo.isPiObjectInjected = isPiObjectInjected;
    window.piDebugInfo.isPiNetHost = isPiNetHost;
    window.piDebugInfo.piBrowserDetected = isUserAgentPiBrowser || isPiObjectInjected || isPiNetHost;
    sendClientDebugLog({ message: "Pi Browser Detection Status", detail: window.piDebugInfo });
  }

  console.log("[Pi Browser Detection] User-Agent check:", isUserAgentPiBrowser);
  console.log("[Pi Browser Detection] window.Pi check:", isPiObjectInjected);
  console.log("[Pi Browser Detection] PiNet host check:", isPiNetHost);

  // Verificamos UserAgent, el objeto Pi inyectado o si estamos en PiNet
  return isUserAgentPiBrowser || isPiObjectInjected || isPiNetHost;
};

/**
 * Carga el script oficial del SDK (con cache para evitar duplicados)
 */
const loadPiScript = (): Promise<void> => {
  // Si ya se está cargando, reutiliza la promesa
  if (piScriptLoading) {
    return piScriptLoading;
  }

  piScriptLoading = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    // Si el SDK ya existe, no hacer nada
    if (window.Pi) {
      console.log("[Pi SDK] Ya está cargado");
      sendClientDebugLog({ message: "Pi SDK already loaded" });
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => {
      console.log("[Pi SDK] Script cargado exitosamente");
      sendClientDebugLog({ message: "Pi SDK script loaded successfully" });
      resolve();
    };
    script.onerror = () => {
      console.error("No se pudo cargar el SDK de Pi");
      sendClientDebugLog({ message: "Failed to load Pi SDK script" });
      piScriptLoading = null; // Reintentar en próxima llamada
      resolve();
    };
    document.head.appendChild(script);
  });

  return piScriptLoading;
};

/**
 * Inicialización del SDK Pi (sin autenticación forzada)
 */
const initializePiSdk = async (): Promise<void> => {
  const pi = window.Pi;
  if (!pi) {
    const errorMsg = "SDK no disponible durante la inicialización.";
    sendClientDebugLog({ message: "SDK Initialization Error", detail: errorMsg });
    throw new Error(errorMsg);
  }

  try {
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    console.log(`[Pi SDK] Red: ${IS_SANDBOX ? "TESTNET" : "MAINNET"}`);
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.sdkInitialized = true;
    }
    sendClientDebugLog({ message: `Pi SDK Initialized: ${IS_SANDBOX ? "TESTNET" : "MAINNET"}`, detail: window.piDebugInfo });
  } catch (e) {
    console.log("[Pi SDK] Ya estaba inicializado o error:", e);
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.sdkInitialized = false;
      window.piDebugInfo.sdkError = e instanceof Error ? e.message : String(e);
    }
    sendClientDebugLog({ message: "Pi SDK Initialization Error/Already Initialized", detail: window.piDebugInfo });
  }
};

/**
 * Autenticación con Pi (se llama cuando sea necesario)
 */
async function authenticateWithPi(): Promise<{ scopes: string[] }> {
  const pi = window.Pi;
  if (!pi) {
    const errorMsg = "SDK no disponible durante la autenticación.";
    sendClientDebugLog({ message: "Authentication Error", detail: errorMsg });
    throw new Error(errorMsg);
  }

  // Pedir permisos al usuario
  const scopes = ["payments"];
  const onIncompletePaymentFound = (payment: unknown) => {
    console.log("Pago pendiente hallado:", payment);
    sendClientDebugLog({ message: "Incomplete Payment Found", detail: payment });
  };

  try {
    const authResult = await pi.authenticate(scopes, onIncompletePaymentFound);
    if (!authResult?.scopes?.includes("payments")) {
      const errorMsg = "El usuario no otorgó permisos de pago.";
      sendClientDebugLog({ message: "Authentication Error", detail: errorMsg });
      throw new Error(errorMsg);
    }
    sendClientDebugLog({ message: "Authentication Successful", detail: authResult.scopes });
    return authResult;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Error de autenticación desconocido.";
    sendClientDebugLog({ message: "Authentication Failed", detail: errorMsg });
    throw e; // Re-throw for handling in createDonationPayment
  }
}

/**
 * Función principal para crear el pago (Donación)
 * IMPORTANTE: Siempre solicita autenticación fresca para evitar problemas de caché
 */
export const createDonationPayment = async (amount: number) => {
  if (typeof window !== "undefined" && window.piDebugInfo) {
    window.piDebugInfo.paymentAttempted = true;
    window.piDebugInfo.paymentStatus = "Iniciando...";
    window.piDebugInfo.paymentError = undefined;
    sendClientDebugLog({ message: "Payment Attempt Initiated", detail: window.piDebugInfo });
  }

  // Pequeño retardo para asegurar que el objeto Pi esté inyectado si hay un retraso en el navegador.
  await new Promise(resolve => setTimeout(resolve, 300)); 

  const browserDetected = isPiBrowser();
  console.log("[createDonationPayment] Pi Browser detectado:", browserDetected);
  sendClientDebugLog({ message: "Pi Browser Detection before Payment", detail: { detected: browserDetected } });

  // Comprobación de seguridad inicial
  if (!browserDetected) {
    const msg = "⚠️ Para operar con $Pi, abre la App desde el navegador de Pi Network.";
    alert(msg);
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.paymentStatus = "Fallo: No en Pi Browser";
      window.piDebugInfo.paymentError = msg;
      sendClientDebugLog({ message: "Payment Failed: Not in Pi Browser", detail: window.piDebugInfo });
    }
    return;
  }

  try {
    // 1. Cargar SDK
    await loadPiScript();
    console.log("[Pi] SDK cargado");
    sendClientDebugLog({ message: "Pi SDK Loaded (Payment Flow)" });

    // 2. Inicializar SDK
    await initializePiSdk();
    console.log("[Pi] SDK inicializado");
    sendClientDebugLog({ message: "Pi SDK Initialized (Payment Flow)" });

    // 3. Autenticar (SIN CACHÉ - solicita cada vez)
    console.log("[Pi] Solicitando autenticación al usuario...");
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.paymentStatus = "Solicitando autenticación...";
      sendClientDebugLog({ message: "Requesting Authentication", detail: window.piDebugInfo });
    }
    let authResult;
    try {
      authResult = await authenticateWithPi();
      console.log("[Pi] Autenticación exitosa. Scopes:", authResult.scopes);
      if (typeof window !== "undefined" && window.piDebugInfo) {
        window.piDebugInfo.paymentStatus = "Autenticación exitosa";
        sendClientDebugLog({ message: "Authentication Successful (Payment Flow)", detail: window.piDebugInfo });
      }
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : "Error de autenticación";
      console.error("[Pi] Error durante la autenticación:", authError);
      alert(
        "No se pudo autenticar con la Pi Wallet. Asegúrate de que otorgaste permisos de pago." + " (Detalles: " + errorMessage + ")"
      );
      if (typeof window !== "undefined" && window.piDebugInfo) {
        window.piDebugInfo.paymentStatus = "Fallo: Autenticación";
        window.piDebugInfo.paymentError = errorMessage;
        sendClientDebugLog({ message: "Authentication Failed (Payment Flow)", detail: window.piDebugInfo });
      }
      return;
    }

    // 4. Crear pago
    const pi = window.Pi;
    console.log("[Pi] Abriendo Wallet para:", amount);
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.paymentStatus = "Abriendo Pi Wallet...";
      sendClientDebugLog({ message: "Opening Pi Wallet", detail: window.piDebugInfo });
    }
    
    pi.createPayment(
      {
        amount: amount,
        memo: "Donación Pi Arcana",
        metadata: { type: "donation" },
      },
      {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("[Pi] Pago creado. ID de transacción:", paymentId);
          if (typeof window !== "undefined" && window.piDebugInfo) {
            window.piDebugInfo.paymentStatus = `Pago creado: ${paymentId}`;
            sendClientDebugLog({ message: "Payment Ready for Server Approval", detail: window.piDebugInfo });
          }
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("[Pi] Éxito. TXID:", txid);
          alert("✨ ¡Gracias por tu ofrenda! El destino te favorece.");
          if (typeof window !== "undefined" && window.piDebugInfo) {
            window.piDebugInfo.paymentStatus = `Completado: ${txid}`;
            sendClientDebugLog({ message: "Payment Completed", detail: window.piDebugInfo });
          }
        },
        onCancel: (paymentId: string) => {
          console.log("[Pi] Usuario canceló el pago:", paymentId);
          if (typeof window !== "undefined" && window.piDebugInfo) {
            window.piDebugInfo.paymentStatus = `Cancelado por usuario: ${paymentId}`;
            window.piDebugInfo.paymentError = "Usuario canceló el pago";
            sendClientDebugLog({ message: "Payment Cancelled by User", detail: window.piDebugInfo });
          }
        },
        onError: (error: Error, payment: unknown) => {
          console.error("[Pi] Error en la Wallet:", error.message);
          if (payment) console.log("Datos del fallo:", payment);
          if (typeof window !== "undefined" && window.piDebugInfo) {
            window.piDebugInfo.paymentStatus = "Fallo en Pi Wallet";
            window.piDebugInfo.paymentError = error.message;
            sendClientDebugLog({ message: "Payment Error in Pi Wallet", detail: { error: error.message, paymentDetails: payment } });
          }
        },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Error desconocido";
    console.error("[Pi] Error crítico:", err);
    alert("Reintenta pulsar el botón para conectar con tu Pi Wallet." + " (Detalles: " + errorMessage + ")");
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.paymentStatus = "Fallo crítico general";
      window.piDebugInfo.paymentError = errorMessage;
      sendClientDebugLog({ message: "Critical Payment Error", detail: window.piDebugInfo });
    }
  }
};

/**
 * Inicializa el SDK de Pi en background (sin autenticación forzada)
 * Esto permite que el SDK esté listo sin molestar al usuario
 */
export const initializePiSdkOnly = async () => {
  try {
    await loadPiScript();
    await initializePiSdk();
    console.log("[Pi] SDK inicializado en background");
    sendClientDebugLog({ message: "Pi SDK Initialized in Background" });
  } catch (error) {
    console.error("[Pi] Error al inicializar SDK:", error);
    if (typeof window !== "undefined" && window.piDebugInfo) {
      window.piDebugInfo.sdkInitialized = false;
      window.piDebugInfo.sdkError = error instanceof Error ? error.message : String(error);
    }
    sendClientDebugLog({ message: "Pi SDK Initialization Error (Background)", detail: window.piDebugInfo });
  }
};

/**
 * Muestra anuncios (Solo si están habilitados)
 */
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;
  await loadPiScript();
  const pi = window.Pi;
  if (!pi?.Ads) return;

  try {
    await pi.Ads.showAd("interstitial");
    sendClientDebugLog({ message: "Ad Shown Successfully" });
  } catch (e) {
    console.error("Error al mostrar anuncio:", e);
    sendClientDebugLog({ message: "Error Showing Ad", detail: e instanceof Error ? e.message : String(e) });
  }
}