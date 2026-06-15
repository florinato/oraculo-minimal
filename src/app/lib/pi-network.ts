/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ID Único de tu aplicación en el Developer Portal de Pi
 */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 INTERRUPTOR DE ANUNCIOS
// false = Deshabilitados (Recomendado para Testnet)
// true  = Habilitados (Para cuando pases a Mainnet)
const ENABLE_ADS = false;

/**
 * Detecta si la aplicación se está ejecutando dentro del ecosistema Pi Network
 */
export const isPiBrowser = (): boolean => {
  if (typeof window === "undefined") return false;

  const globalWindow = window as any;
  const ua = navigator.userAgent || navigator.vendor || globalWindow.opera;
  
  // Comprobación triple: UserAgent oficial, Objeto Pi inyectado, o dominio PiNet
  const hasPiUA = /PiBrowser/i.test(ua);
  const hasPiObject = !!globalWindow.Pi;
  const isPiNet = typeof window !== "undefined" && window.location.host.includes('pinet.com');

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

    // Si ya está inicializado, no hacer nada
    if (globalWindow.Pi && globalWindow.piInitialized) {
      resolve();
      return;
    }

    // Si está cargando, esperar a que termine
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

    // Inyectar el script oficial de Pi
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      const waitForPi = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(waitForPi);

          try {
            // sandbox: true permite probar pagos en Testnet sin gastar Pi reales
            globalWindow.Pi.init({ version: "2.0", sandbox: true });
            console.log("[Pi SDK] Inicializado en modo Sandbox (Testnet)");
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
      console.error("[Pi SDK] Error al cargar el script");
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Muestra un anuncio si están habilitados y estamos en el entorno correcto
 */
export async function showInterstitialAd(): Promise<void> {
  if (!ENABLE_ADS || !isPiBrowser()) {
    console.log("[Pi Ads] Saltando anuncios (Deshabilitados o fuera de Pi Browser)");
    return;
  }

  await initializePiSdk();
  const globalWindow = window as any;

  if (!globalWindow.Pi?.Ads) {
    console.warn("[Pi Ads] Recurso de anuncios no disponible.");
    return;
  }

  try {
    const adResult = await globalWindow.Pi.Ads.showAd("interstitial");
    console.log("[Pi Ads] Resultado del anuncio:", adResult);
  } catch (error) {
    console.error("[Pi Ads] Error al mostrar:", error);
  }
}

/**
 * Crea un pago de donación en la red Pi
 * @param amount Cantidad de Pi (ej: 0.1)
 */
export const createDonationPayment = async (amount: number) => {
  // 1. Verificación de entorno amigable
  if (!isPiBrowser()) {
    alert("⚠️ Por favor, abre esta App desde el Pi Browser para donar o realizar pagos en $Pi.");
    return;
  }

  // 2. Asegurar inicialización justo antes del pago
  await initializePiSdk();
  const pi = (window as any).Pi;

  if (!pi) {
    alert("No se pudo conectar con la Pi Wallet. Inténtalo de nuevo.");
    return;
  }

  // 3. Ejecutar el flujo de pago oficial
  try {
    pi.createPayment({
      amount: amount,
      memo: "Donación Pi Arcana Tarot",
      metadata: { type: "donation" },
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        // En Testnet este es el ID que verás en la consola
        console.log("[Pi SDK] Pago creado. ID de aprobación:", paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi SDK] ¡Pago completado con éxito! TXID:", txid);
        alert("✨ ¡Gracias por tu ofrenda! El destino te favorece.");
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi SDK] Pago cancelado por el usuario:", paymentId);
      },
      onError: (error: Error, payment: any) => {
        console.error("[Pi SDK] Error en la transacción:", error);
        if (payment) console.log("Detalles del fallo:", payment);
      },
    });
  } catch (err) {
    console.error("[Pi SDK] Error crítico al abrir Wallet:", err);
  }
};