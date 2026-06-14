/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

/**
 * Inicializa el SDK de Pi Network si no está cargado
 */
export function initializePiSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const globalWindow = window as any;

    // Si Pi ya está completamente inicializado, resuelve
    if (globalWindow.Pi && globalWindow.piInitialized) {
      console.log("[v0] Pi SDK ya está inicializado");
      resolve();
      return;
    }

    // Si ya se está cargando, espera
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
      }, 10000);
      return;
    }

    // Cargar el script oficial de Pi
    globalWindow.piLoading = true;
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      console.log("[v0] Script de Pi cargado.");
      
      // Esperar a que el objeto Pi esté inyectado en el window
      const waitForPi = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(waitForPi);
          console.log("[v0] Pi disponible. Inicializando...");
          
          // CORRECCIÓN: Pi.init SOLO recibe la versión en su SDK oficial
          globalWindow.Pi.init({ version: "2.0" });

          // Esperar a que ready se resuelva
          if (globalWindow.Pi.ready) {
            globalWindow.Pi.ready
              .then(() => {
                console.log("[v0] Pi.ready completado");
                globalWindow.piInitialized = true;
                globalWindow.piLoading = false;
                resolve();
              })
              .catch((err: any) => {
                console.error("[v0] Error en Pi.ready:", err);
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

      // Timeout de seguridad si falla la carga
      setTimeout(() => {
        clearInterval(waitForPi);
        globalWindow.piLoading = false;
        if (!globalWindow.piInitialized) {
          globalWindow.piInitialized = true;
        }
        resolve();
      }, 5000);
    };

    script.onerror = () => {
      console.error("[v0] Error al cargar script de Pi");
      globalWindow.piLoading = false;
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Muestra un anuncio intersticial de Pi Network
 */
export async function showInterstitialAd(): Promise<void> {
  // Asegurar la carga limpia del SDK primero
  await initializePiSdk();

  return new Promise((resolve) => {
    const globalWindow = window as any;

    if (!globalWindow.Pi || !globalWindow.Pi.Ads) {
      console.warn("[v0] Pi Ads no disponible en este entorno");
      resolve();
      return;
    }

    console.log("[v0] Solicitando anuncio intersticial...");

    // CORRECCIÓN: Se vuelve a añadir el objeto de configuración requerido por el SDK
    globalWindow.Pi.Ads.showAd({ adType: "interstitial" })
      .then((adResult: any) => {
        console.log("[v0] Resultado del anuncio:", adResult);
        alert("Respuesta de Pi: " + JSON.stringify(adResult));
        resolve();
      })
      .catch((error: any) => {
        console.error("[v0] Error al mostrar el anuncio:", error);
        alert("Error de Pi Ads: " + (error?.message || JSON.stringify(error)));
        resolve();
      });
  });
}