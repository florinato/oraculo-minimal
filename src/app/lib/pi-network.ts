/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

// 🚦 INTERRUPTOR DE ANUNCIOS
// false = Deshabilitados (para testear el tarot rápido sin esperas)
// true  = Habilitados (para cuando pases la app a Mainnet)
const ENABLE_ADS = false;

/**
 * Inicializa el SDK de Pi Network de forma segura
 */
export function initializePiSdk(): Promise<void> {
  return new Promise((resolve) => {
    // Si los anuncios están apagados, no gastamos recursos cargando el SDK
    if (!ENABLE_ADS || typeof window === "undefined") {
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
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
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
            globalWindow.Pi.init({ version: "2.0" });
          } catch (e) {
            console.error("[Pi SDK] Error en Pi.init:", e);
          }

          if (globalWindow.Pi.ready) {
            globalWindow.Pi.ready
              .then(() => {
                globalWindow.piInitialized = true;
                globalWindow.piLoading = false;
                resolve();
              })
              .catch(() => {
                globalWindow.piInitialized = true;
                globalWindow.piLoading = false;
                resolve();
              });
          } else {
            globalWindow.piInitialized = true;
            globalWindow.piLoading = false;
            resolve();
          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(waitForPi);
        globalWindow.piLoading = false;
        globalWindow.piInitialized = true;
        resolve();
      }, 4000);
    };

    script.onerror = () => {
      globalWindow.piLoading = false;
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Muestra un anuncio de Pi Network si están habilitados
 */
export async function showInterstitialAd(): Promise<void> {
  return new Promise(async (resolve) => {
    // Si están deshabilitados, saltamos instantáneamente sin esperar nada
    if (!ENABLE_ADS) {
      console.log("[Pi Ads] Anuncios deshabilitados temporalmente en Testnet. Saltando...");
      resolve();
      return;
    }

    // Si están habilitados (Mainnet), ejecutamos la lógica oficial
    await initializePiSdk();

    const globalWindow = window as any;

    if (!globalWindow.Pi || !globalWindow.Pi.Ads) {
      console.warn("[Pi Ads] SDK de anuncios no disponible.");
      resolve();
      return;
    }

    const timeoutSeguridad = setTimeout(() => {
      console.warn("[Pi Ads] Timeout de seguridad (4s). Continuando...");
      resolve();
    }, 4000);

    globalWindow.Pi.Ads.showAd("interstitial" as any)
      .then((adResult: any) => {
        clearTimeout(timeoutSeguridad);
        console.log("[Pi Ads] Anuncio procesado:", adResult);
        resolve();
      })
      .catch((error: any) => {
        clearTimeout(timeoutSeguridad);
        console.error("[Pi Ads] Error controlado:", error);
        resolve();
      });
  });
}