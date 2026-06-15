/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ID Único de tu aplicación en el Developer Portal de Pi
 */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 INTERRUPTOR DE ANUNCIOS
const ENABLE_ADS = false;

/**
 * Detecta si la aplicación se está ejecutando dentro del ecosistema Pi Network
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;

  const globalWindow = window as any;
  const ua = navigator.userAgent || navigator.vendor || globalWindow.opera;
  
  const hasPiUA = /PiBrowser/i.test(ua);
  const hasPiObject = !!globalWindow.Pi;
  const isPiNet = window.location.host.includes('pinet.com');

  return hasPiUA || hasPiObject || isPiNet;
};

/**
 * Inicializa el SDK de Pi Network de forma segura
 */
export function initializePiSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
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
            // sandbox: true para Testnet
            globalWindow.Pi.init({ version: "2.0", sandbox: true });
            console.log("[Pi SDK] Inicializado");
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
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Autentica al usuario (Paso obligatorio antes de pagar)
 */
async function authenticateUser(): Promise<any> {
  const pi = (window as any).Pi;
  if (!pi) return null;

  const scopes = ["payments"];
  
  const onIncompletePaymentFound = (payment: any) => {
    console.log("[Pi SDK] Pago incompleto hallado:", payment);
    // Aquí podrías avisar a tu backend para completar el pago si quedó colgado
  };

  try {
    return await pi.authenticate(scopes, onIncompletePaymentFound);
  } catch (error) {
    console.error("[Pi SDK] Error en autenticación:", error);
    throw error;
  }
}

/**
 * Muestra un anuncio si están habilitados
 */
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) return;

  await initializePiSdk();
  const globalWindow = window as any;

  if (!globalWindow.Pi?.Ads) return;

  try {
    await globalWindow.Pi.Ads.showAd("interstitial");
  } catch (error) {
    console.error("[Pi Ads] Error:", error);
  }
}

/**
 * Crea un pago de donación en la red Pi
 */
export const createDonationPayment = async (amount: number) => {
  // 1. Verificación de entorno
  if (!isPiBrowser()) {
    alert("⚠️ Por favor, abre esta App desde el Pi Browser para operar con $Pi.");
    return;
  }

  try {
    // 2. Aseguramos inicialización
    await initializePiSdk();
    const pi = (window as any).Pi;

    if (!pi) throw new Error("Pi SDK no cargado");

    // 3. PASO CLAVE: Autenticar (pide permisos al usuario si es la primera vez)
    console.log("[Pi SDK] Autenticando usuario...");
    await authenticateUser();

    // 4. Ejecutar el flujo de pago
    console.log("[Pi SDK] Solicitando pago de:", amount);
    pi.createPayment({
      amount: amount,
      memo: "Donación Pi Arcana Tarot",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("[Pi SDK] Pago pendiente de aprobación. ID:", paymentId);
        // En Testnet se queda aquí si no hay backend, pero la Wallet se abrirá.
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi SDK] Pago completado. TXID:", txid);
        alert("✨ ¡Gracias por tu ofrenda!");
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi SDK] Pago cancelado:", paymentId);
      },
      onError: (error: Error, payment: any) => {
        console.error("[Pi SDK] Error:", error);
        alert("Error en la Wallet: " + error.message);
      },
    });

  } catch (err: any) {
    console.error("[Pi SDK] Error crítico:", err);
    alert("No se pudo conectar con la Wallet. Inténtalo de nuevo.");
  }
};