export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

/**
 * Muestra un anuncio intersticial de Pi Network
 * @returns Promise que se resuelve cuando el anuncio se cierra
 */
export function showInterstitialAd(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      console.warn("[Pi Network] SDK no disponible");
      resolve();
      return;
    }

    const pi = (window as any).Pi;
    if (!pi) {
      console.warn("[Pi Network] SDK no disponible");
      resolve();
      return;
    }

    pi.showAd({
      adType: "interstitial",
      onClose: () => {
        console.log("[Pi Network] Anuncio cerrado");
        resolve();
      },
      onError: (error: any) => {
        console.error("[Pi Network] Error en anuncio:", error);
        resolve();
      },
    });
  });
}
