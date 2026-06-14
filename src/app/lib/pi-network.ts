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

    // Cargar el script de Pi
    globalWindow.piLoading = true;
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      console.log("[v0] Script de Pi cargado.");
      
      // Esperar a que Pi esté disponible
      const waitForPi = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(waitForPi);
          console.log("[v0] Pi disponible. Inicializando...");
          
          // Inicializar Pi
          globalWindow.Pi.init({
            version: "2.0",
            sandbox: false,
            appId: PI_APP_ID,
          });

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

      // Timeout si Pi no se carga en 5 segundos
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
  // Primero asegurarse de que Pi está cargado e inicializado
  await initializePiSdk();

  return new Promise((resolve) => {
    const globalWindow = window as any;

    // Verificar que Pi.Ads está disponible
    if (!globalWindow.Pi) {
      console.warn("[v0] Pi no está disponible");
      alert("Pi SDK no se ha cargado correctamente");
      resolve();
      return;
    }

    if (!globalWindow.Pi.Ads) {
      console.warn("[v0] Pi.Ads no disponible");
      alert("Pi.Ads no está disponible. SDK no completamente inicializado");
      resolve();
      return;
    }

    console.log("[v0] Mostrando anuncio intersticial...");
    alert("Iniciando anuncio de Pi Network...");

    globalWindow.Pi.Ads.showAd()
      .then((adResult: any) => {
        console.log("[v0] Resultado del anuncio:", adResult);
        alert("Respuesta de Pi: " + JSON.stringify(adResult));
        resolve();
      })
      .catch((error: any) => {
        console.error("[v0] Error en anuncio:", error);
        alert("Error en anuncio: " + (error?.message || JSON.stringify(error)));
        resolve();
      });
  });
}
