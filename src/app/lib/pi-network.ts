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

declare global {
  interface Window {
    Pi: PiType;
  }
}

/**
 * Detección fiable del Pi Browser
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";

  // Verificamos UserAgent, el objeto Pi inyectado o si estamos en PiNet
  return (
    /PiBrowser/i.test(ua) ||
    !!window.Pi ||
    window.location.host.includes("pinet.com")
  );
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
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => {
      console.log("[Pi SDK] Script cargado exitosamente");
      resolve();
    };
    script.onerror = () => {
      console.error("No se pudo cargar el SDK de Pi");
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
  if (!pi) throw new Error("SDK no disponible");

  try {
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    console.log(`[Pi SDK] Red: ${IS_SANDBOX ? "TESTNET" : "MAINNET"}`);
  } catch (e) {
    // Ya estaba inicializado
    console.log("[Pi SDK] Ya estaba inicializado");
  }
};

/**
 * Autenticación con Pi (se llama cuando sea necesario)
 */
async function authenticateWithPi(): Promise<{ scopes: string[] }> {
  const pi = window.Pi;
  if (!pi) throw new Error("SDK no disponible");

  // Pedir permisos al usuario
  const scopes = ["payments"];
  const onIncompletePaymentFound = (payment: unknown) => {
    console.log("Pago pendiente hallado:", payment);
  };

  const authResult = await pi.authenticate(scopes, onIncompletePaymentFound);
  
  if (!authResult?.scopes?.includes("payments")) {
    throw new Error("El usuario no otorgó permisos de pago.");
  }

  return authResult;
}

/**
 * Función principal para crear el pago (Donación)
 * IMPORTANTE: Siempre solicita autenticación fresca para evitar problemas de caché
 */
export const createDonationPayment = async (amount: number) => {
  // Comprobación de seguridad inicial
  if (!isPiBrowser()) {
    alert(
      "⚠️ Para operar con $Pi, abre la App desde el navegador de Pi Network."
    );
    return;
  }

  try {
    // 1. Cargar SDK
    await loadPiScript();
    console.log("[Pi] SDK cargado");

    // 2. Inicializar SDK
    await initializePiSdk();
    console.log("[Pi] SDK inicializado");

    // 3. Autenticar (SIN CACHÉ - solicita cada vez)
    console.log("[Pi] Solicitando autenticación al usuario...");
    let authResult;
    try {
      authResult = await authenticateWithPi();
      console.log("[Pi] Autenticación exitosa. Scopes:", authResult.scopes);
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : "Error de autenticación";
      console.error("[Pi] Error durante la autenticación:", authError);
      alert(
        "No se pudo autenticar con la Pi Wallet. Asegúrate de que otorgaste permisos de pago."
      );
      return;
    }

    // 4. Crear pago
    const pi = window.Pi;
    console.log("[Pi] Abriendo Wallet para:", amount);
    
    pi.createPayment(
      {
        amount: amount,
        memo: "Donación Pi Arcana",
        metadata: { type: "donation" },
      },
      {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("[Pi] Pago creado. ID de transacción:", paymentId);
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("[Pi] Éxito. TXID:", txid);
          alert("✨ ¡Gracias por tu ofrenda! El destino te favorece.");
        },
        onCancel: (paymentId: string) => {
          console.log("[Pi] Usuario canceló el pago:", paymentId);
        },
        onError: (error: Error, payment: unknown) => {
          console.error("[Pi] Error en la Wallet:", error.message);
          if (payment) console.log("Datos del fallo:", payment);
        },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Error desconocido";
    console.error("[Pi] Error crítico:", err);
    alert("Reintenta pulsar el botón para conectar con tu Pi Wallet.");
  }
};

/**
 * Inicializa el SDK de Pi en background (SIN autenticación)
 * Esto permite que el SDK esté listo sin molestar al usuario
 */
export const initializePiSdkOnly = async () => {
  try {
    await loadPiScript();
    await initializePiSdk();
    console.log("[Pi] SDK inicializado en background");
  } catch (error) {
    console.error("[Pi] Error al inicializar SDK:", error);
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
  } catch (e) {
    console.error("Error al mostrar anuncio:", e);
  }
}
