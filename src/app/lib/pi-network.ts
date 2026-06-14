/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

/**
 * Muestra un anuncio intersticial de Pi Network
 * @returns Promise que se resuelve cuando el anuncio se cierra
 */
export function showInterstitialAd(): Promise<void> {
  return new Promise((resolve) => {
    // Si estamos en el servidor, salimos rápido
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    // Convertimos window a 'any' para saltarnos el bloqueo de TypeScript
    const globalWindow = window as any;

    // Ahora comprobamos si Pi existe sin que TypeScript se queje
    if (!globalWindow.Pi) {
      console.warn("[Pi Network] SDK no disponible");
      resolve();
      return;
    }

    // Ejecutamos el anuncio usando la variable puente
    globalWindow.Pi.Ads.showAd({ adType: "interstitial" })
      .then((adResult: any) => {
        if (adResult.status === "COMPLETED") {
          console.log("Anuncio visto con éxito");
        }
        resolve();
      })
      .catch((error: any) => {
        console.error("Error al cargar el anuncio de Pi:", error);
        resolve();
      });
  });
}
