/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

/**
 * Muestra un anuncio intersticial de Pi Network con Alertas de Diagnóstico
 */
export function showInterstitialAd(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const globalWindow = window as any;

    // DIAGNÓSTICO 1: ¿El script de Pi realmente se ha cargado en el móvil?
    if (!globalWindow.Pi) {
      alert("Alerta 1: El SDK de Pi NO se ha cargado en el navegador.");
      resolve();
      return;
    }

    alert("Alerta 2: SDK detectado. Solicitando anuncio a Pi Network...");

    globalWindow.Pi.Ads.showAd({ adType: "interstitial" })
      .then((adResult: any) => {
        // DIAGNÓSTICO 2: Qué responde Pi exactamente
        alert("Alerta 3: Pi respondió. Estado: " + JSON.stringify(adResult));
        resolve();
      })
      .catch((error: any) => {
        // DIAGNÓSTICO 3: Si hay un error médico del SDK
        alert("Alerta Error: " + (error?.message || JSON.stringify(error)));
        resolve();
      });
  });
}