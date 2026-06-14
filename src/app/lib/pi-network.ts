/* eslint-disable @typescript-eslint/no-explicit-any */
export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

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
      console.log("[v0] Pi SDK ya está inicializado");
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
      }, 10000);
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
          
          // DIAGNÓSTICO 1: Probamos Pi.init con un try/catch aislado
          try {
            globalWindow.Pi.init({ version: "2.0" });
            console.log("[v0] Pi.init ejecutado con éxito");
          } catch (initError: any) {
            alert("AVISO en Pi.init: " + (initError?.message || JSON.stringify(initError)));
          }

          if (globalWindow.Pi.ready) {
            globalWindow.Pi.ready
              .then(() => {
                globalWindow.piInitialized = true;
                globalWindow.piLoading = false;
                resolve();
              })
              .catch((err: any) => {
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
        if (!globalWindow.piInitialized) {
          globalWindow.piInitialized = true;
        }
        resolve();
      }, 5000);
    };

    script.onerror = () => {
      globalWindow.piLoading = false;
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Muestra un anuncio intersticial probando todas las variantes de la API de Pi
 */
export async function showInterstitialAd(): Promise<void> {
  await initializePiSdk();

  return new Promise(async (resolve) => {
    const globalWindow = window as any;

    if (!globalWindow.Pi || !globalWindow.Pi.Ads) {
      alert("Diagnóstico: El objeto Pi.Ads no existe en este entorno.");
      resolve();
      return;
    }

    // --- CADENA DE FALLBACKS DE AUTORECUPERACIÓN ---
    
    // Opción 1: El estándar oficial documentado
    try {
      console.log("[v0] Intentando Opción 1: { adType: 'interstitial' }");
      const result = await globalWindow.Pi.Ads.showAd({ adType: "interstitial" });
      alert("¡ÉXITO OPCIÓN 1! Respuesta: " + JSON.stringify(result));
      resolve();
      return;
    } catch (err1: any) {
      console.warn("Falló Opción 1:", err1?.message || err1);
      
      // Si la opción 1 tira 'invalid argument', saltamos a la Opción 2: Pasar el string directo
      try {
        console.log("[v0] Intentando Opción 2: 'interstitial' (string directo)");
        const result = await globalWindow.Pi.Ads.showAd("interstitial" as any);
        alert("¡ÉXITO OPCIÓN 2! Respuesta: " + JSON.stringify(result));
        resolve();
        return;
      } catch (err2: any) {
        console.warn("Falló Opción 2:", err2?.message || err2);
        
        // Opción 3: Variación de clave alternativa { type: 'interstitial' }
        try {
          console.log("[v0] Intentando Opción 3: { type: 'interstitial' }");
          const result = await globalWindow.Pi.Ads.showAd({ type: "interstitial" } as any);
          alert("¡ÉXITO OPCIÓN 3! Respuesta: " + JSON.stringify(result));
          resolve();
          return;
        } catch (err3: any) {
          console.warn("Falló Opción 3:", err3?.message || err3);
          
          // Opción 4: Totalmente vacío (por si la versión del SDK autodetecta el bloque)
          try {
            console.log("[v0] Intentando Opción 4: sin argumentos");
            const result = await globalWindow.Pi.Ads.showAd();
            alert("¡ÉXITO OPCIÓN 4! Respuesta: " + JSON.stringify(result));
            resolve();
            return;
          } catch (err4: any) {
            // Si todo lo humano y lo divino falla, escupimos el error final exacto
            console.error("[v0] Absolutamente todas las variantes fallaron.");
            alert(
              "Error definitivo en Pi Ads.\n\n" +
              "Opción 1: " + (err1?.message || JSON.stringify(err1)) + "\n" +
              "Opción 2: " + (err2?.message || JSON.stringify(err2)) + "\n" +
              "Opción 3: " + (err3?.message || JSON.stringify(err3)) + "\n" +
              "Opción 4: " + (err4?.message || JSON.stringify(err4))
            );
            resolve();
          }
        }
      }
    }
  });
}