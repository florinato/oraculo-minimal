export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 CONFIGURACIÓN DE RED Y UTILIDADES
const IS_SANDBOX = true; // true = Testnet (Pi de prueba) | false = Mainnet (Pi Real)
const ENABLE_ADS = false; // true = Activar anuncios | false = Desactivar

// 🔄 Estado global para evitar cargas duplicadas
let piScriptLoading: Promise<void> | null = null;
let piAuthenticated = false;
let cachedAuthResult: { scopes: string[] } | null = null;

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
 * Inicialización y Autenticación (El "Logueo" interno de Pi)
 */
async function authenticateWithPi(): Promise<{ scopes: string[] }> {
  // Si ya está autenticado, reutiliza el resultado cacheado
  if (piAuthenticated && cachedAuthResult) {
    console.log("[Pi] Ya está autenticado");
    return cachedAuthResult;
  }

  const pi = window.Pi;
  if (!pi) throw new Error("SDK no disponible");

  // 1. Inicializar (Aquí se decide la RED)
  try {
    await pi.init({ version: "2.0", sandbox: IS_SANDBOX });
    console.log(`[Pi SDK] Red: ${IS_SANDBOX ? "TESTNET" : "MAINNET"}`);
  } catch (e) {
    // Ya estaba inicializado
    console.log("[Pi SDK] Ya estaba inicializado");
  }

  // 2. Autenticar (Pide permiso de lectura de usuario y pagos)
  const scopes = ["payments"];
  const onIncompletePaymentFound = (payment: unknown) => {
    console.log("Pago pendiente hallado:", payment);
    // Nota: Aquí se debería avisar al servidor para completar el pago si es necesario
  };

  const authResult = await pi.authenticate(scopes, onIncompletePaymentFound);
  piAuthenticated = true;
  cachedAuthResult = authResult;
  return authResult;
}

/**
 * Función principal para crear el pago (Donación)
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
    // Cargar SDK (reutiliza si ya está cargado)
    await loadPiScript();

    // Paso obligatorio: Autenticar para que Pi abra la Wallet
    console.log("[Pi] Autenticando...");
    let authResult;
    try {
      authResult = await authenticateWithPi();
      if (
        !authResult ||
        !authResult.scopes ||
        !authResult.scopes.includes("payments")
      ) {
        throw new Error(
          "Autenticación exitosa, pero el scope 'payments' no fue concedido."
        );
      }
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : "Error desconocido";
      console.error("[Pi] Error durante la autenticación:", authError);
      alert(
        "No se pudo autenticar con la Pi Wallet. Asegúrate de que tu aplicación tiene permisos de pago."
      );
      return;
    }

    const pi = window.Pi;

    // Lanzar el pago
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
          // En Testnet la wallet se abre aquí aunque no tengas backend de aprobación.
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
 * Inicializa el SDK de Pi y autentica al usuario.
 * Se puede llamar de forma segura múltiples veces (usa caché interno).
 */
export const initializePiSdkAndAuthenticate = async () => {
  try {
    await loadPiScript();
    await authenticateWithPi();
    console.log("[Pi] Inicialización completada");
  } catch (error) {
    console.error("[Pi] Error en inicialización:", error);
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
