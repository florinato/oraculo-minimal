/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 INTERRUPTOR DE ANUNCIOS
const ENABLE_ADS = false;

/**
 * Detecta si estamos dentro del Pi Browser
 */
const isPiBrowser = () => {
  if (typeof window === "undefined") return false;
  return /PiBrowser/i.test(navigator.userAgent) || (window as any).Pi !== undefined;
};

/**
 * Inicializa el SDK de Pi Network de forma segura
 */
export function initializePiSdk(): Promise<void> {
  return new Promise((resolve) => {
    // Si no estamos en el Pi Browser, avisamos por consola y salimos
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (!isPiBrowser()) {
      console.warn("[Pi SDK] No estás en el Pi Browser. Las funciones de red no estarán disponibles.");
      resolve();
      return;
    }

    const globalWindow = window as any;

    if (globalWindow.Pi && globalWindow.piInitialized) {
      resolve();
      return;
    }

    if (globalWindow.piLoading) {
      const checkInterval = setInterval(() => {
        if (globalWindow.piInitialized) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    globalWindow.piLoading = true;
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      const waitForPi = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(waitForPi);

          try {
            // sandbox: true permite probar pagos en Testnet sin Pi reales
            globalWindow.Pi.init({ version: "2.0", sandbox: true });
            console.log("[Pi SDK] Inicializado correctamente en modo Sandbox");
          } catch (e) {
            console.error("[Pi SDK] Error en Pi.init:", e);
          }

          globalWindow.piInitialized = true;
          globalWindow.piLoading = false;
          resolve();
        }
      }, 100);
    };

    script.onerror = () => {
      globalWindow.piLoading = false;
      console.error("[Pi SDK] Error al cargar el script del SDK");
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Muestra un anuncio de Pi Network si están habilitados
 */
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS) {
    console.log("[Pi Ads] Anuncios deshabilitados.");
    return;
  }

  if (!isPiBrowser()) {
    console.warn("[Pi Ads] Los anuncios solo funcionan en el Pi Browser.");
    return;
  }

  await initializePiSdk();
  const globalWindow = window as any;

  if (!globalWindow.Pi?.Ads) {
    console.warn("[Pi Ads] El recurso de anuncios no está listo.");
    return;
  }

  try {
    const adResult = await globalWindow.Pi.Ads.showAd("interstitial");
    console.log("[Pi Ads] Anuncio procesado:", adResult);
  } catch (error) {
    console.error("[Pi Ads] Error al mostrar anuncio:", error);
  }
}

/**
 * Crea un pago de donación en la red Pi
 */
export const createDonationPayment = async (amount: number) => {
  // 1. Verificación de entorno PRO
  if (!isPiBrowser()) {
    alert("⚠️ Para realizar pagos o donaciones en $Pi, por favor abre esta aplicación desde el Pi Browser oficial.");
    return;
  }

  // 2. Aseguramos inicialización
  await initializePiSdk();
  const pi = (window as any).Pi;

  if (!pi) {
    console.error("El objeto Pi no se pudo cargar.");
    return;
  }

  // 3. Flujo de pago
  try {
    pi.createPayment({
      amount: amount,
      memo: "Donación para la aplicación",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("[Pi SDK] Pago creado. ID para aprobar:", paymentId);
        // Alertamos al usuario para que sepa que la wallet se está abriendo
        console.log("Por favor, confirma el pago en tu Pi Wallet.");
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi SDK] ¡Éxito! Pago completado. TXID:", txid);
        alert("✨ ¡Gracias por tu ofrenda! El destino te sonríe.");
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi SDK] Pago cancelado por el usuario:", paymentId);
      },
      onError: (error: Error, payment: any) => {
        console.error("[Pi SDK] Error en la transacción:", error);
        if (payment) console.log("Datos del pago fallido:", payment);
      },
    });
  } catch (err) {
    console.error("Error al disparar el flujo de pago:", err);
  }
};