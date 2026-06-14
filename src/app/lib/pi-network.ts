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

    // Si Pi ya está cargado, resuelve inmediatamente
    if (globalWindow.Pi) {
      console.log("[v0] Pi SDK ya está cargado");
      resolve();
      return;
    }

    // Si el script se está cargando, espera un poco
    if (globalWindow.piLoading) {
      const checkInterval = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 5000);
      return;
    }

    // Cargar el script de Pi
    globalWindow.piLoading = true;
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      console.log("[v0] Script de Pi cargado. Inicializando...");
      globalWindow.Pi?.init?.({
        version: "2.0",
        sandbox: false,
        appId: PI_APP_ID,
      });
      globalWindow.piLoading = false;
      resolve();
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
  // Primero asegurarse de que Pi está cargado
  await initializePiSdk();

  return new Promise((resolve) => {
    const globalWindow = window as any;

    // Verificar que Pi está disponible
    if (!globalWindow.Pi?.Ads?.showAd) {
      console.warn("[v0] Pi.Ads.showAd no disponible");
      alert("Pi SDK no está completamente cargado");
      resolve();
      return;
    }

    console.log("[v0] Mostrando anuncio intersticial...");
    alert("Mostrando anuncio de Pi Network...");

    globalWindow.Pi.Ads.showAd({ adType: "interstitial" })
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
