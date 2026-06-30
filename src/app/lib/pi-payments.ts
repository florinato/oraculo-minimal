/* eslint-disable @typescript-eslint/no-explicit-any */

export const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

declare global {
  interface Window {
    Pi?: any;
  }
}

interface PaymentCallbacks {
  onApprovalRequested?: (paymentId: string) => void;
  onApprovalSuccess?: () => void;
  onApprovalError?: (error: string) => void;
  onCompletionStart?: () => void;
  onCompletionSuccess?: () => void;
  onCompletionError?: (error: string) => void;
  onCancelled?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Inicializa el SDK de Pi Network detectando el entorno automáticamente
 */
export async function initializePiSdk(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const globalWindow = window as any;

  // Si ya está inicializado, retornar
  if (globalWindow.piInitialized) return true;

  // Si está en proceso de carga, esperar
  if (globalWindow.piLoading) {
    return new Promise((resolve) => {
      const maxWait = 10000;
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (globalWindow.piInitialized) {
          clearInterval(checkInterval);
          resolve(true);
        }
        if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  // Cargar el SDK
  globalWindow.piLoading = true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      const waitForPi = setInterval(() => {
        if (globalWindow.Pi) {
          clearInterval(waitForPi);

          try {
            // Detectar si estamos en Pi Browser o navegador normal
            const isPiBrowser = window.navigator.userAgent.toLowerCase().includes("pibrowser");
            const sandboxMode = !isPiBrowser;

            globalWindow.Pi.init({
              version: "2.0",
              sandbox: sandboxMode,
              appId: PI_APP_ID,
              onIncompletePaymentFound: (payment: any) => {
                console.log("[Pi Payments] Pago incompleto detectado:", payment);
                // Intentar completar automáticamente
                if (payment?.identifier && payment?.transaction?.txid) {
                  completePaymentOnBackend(payment.identifier, payment.transaction.txid);
                }
              }
            });

            if (globalWindow.Pi.ready) {
              globalWindow.Pi.ready
                .then(() => {
                  globalWindow.piInitialized = true;
                  globalWindow.piLoading = false;
                  console.log("[Pi Payments] SDK inicializado exitosamente");
                  resolve(true);
                })
                .catch((err: any) => {
                  console.error("[Pi Payments] Error en Pi.ready:", err);
                  globalWindow.piInitialized = true;
                  globalWindow.piLoading = false;
                  resolve(false);
                });
            } else {
              globalWindow.piInitialized = true;
              globalWindow.piLoading = false;
              resolve(true);
            }
          } catch (e) {
            console.error("[Pi Payments] Error inicializando SDK:", e);
            globalWindow.piInitialized = true;
            globalWindow.piLoading = false;
            resolve(false);
          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(waitForPi);
        globalWindow.piLoading = false;
        globalWindow.piInitialized = true;
        resolve(true);
      }, 5000);
    };

    script.onerror = () => {
      console.error("[Pi Payments] Error cargando script de Pi SDK");
      globalWindow.piLoading = false;
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Autentica al usuario con el SDK de Pi
 */
export async function authenticateUser(): Promise<any> {
  if (typeof window === "undefined") throw new Error("No hay contexto de ventana");

  const globalWindow = window as any;

  if (!globalWindow.Pi) {
    throw new Error("SDK de Pi no disponible. Abre esta app en Pi Browser.");
  }

  try {
    console.log("[Pi Payments] Iniciando autenticación...");
    const auth = await globalWindow.Pi.authenticate(
      ["payments"],
      (payment: any) => {
        // Callback de pagos incompletos
        console.log("[Pi Payments] Pago incompleto encontrado durante auth:", payment);
      }
    );
    console.log("[Pi Payments] Autenticación exitosa:", auth.user.username);
    return auth;
  } catch (error: any) {
    console.error("[Pi Payments] Error en autenticación:", error);
    throw error;
  }
}

/**
 * Aprueba el pago en el backend
 */
async function approvePaymentOnBackend(
  paymentId: string,
  username: string,
  amount: number,
  memo: string
): Promise<boolean> {
  try {
    console.log("[Pi Payments] Aprobando pago en backend...");
    const response = await fetch("/api/payments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId,
        username,
        amount,
        memo,
        isSimulated: false
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error aprobando pago");
    }

    console.log("[Pi Payments] Pago aprobado en backend");
    return true;
  } catch (error: any) {
    console.error("[Pi Payments] Error en aprobación backend:", error);
    throw error;
  }
}

/**
 * Completa el pago en el backend
 */
async function completePaymentOnBackend(paymentId: string, txid: string): Promise<boolean> {
  try {
    console.log("[Pi Payments] Completando pago en backend...");
    const response = await fetch("/api/payments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId,
        txid,
        isSimulated: false
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error completando pago");
    }

    console.log("[Pi Payments] Pago completado en backend");
    return true;
  } catch (error: any) {
    console.error("[Pi Payments] Error en completación backend:", error);
    throw error;
  }
}

/**
 * Crea un pago de donación
 */
export async function createDonation(
  amount: number,
  memo: string,
  callbacks?: PaymentCallbacks
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Debe ejecutarse en el navegador");
  }

  const globalWindow = window as any;

  // Verificar que el SDK esté disponible
  if (!globalWindow.Pi) {
    callbacks?.onError?.("SDK de Pi no disponible");
    throw new Error("SDK de Pi no disponible. Abre la app en Pi Browser.");
  }

  try {
    // Intentar autenticarse si no está autenticado
    let auth: any;
    try {
      auth = await authenticateUser();
    } catch (e) {
      callbacks?.onError?.("No se pudo autenticar");
      throw e;
    }

    const username = auth.user.username;

    // Crear el pago
    console.log("[Pi Payments] Creando pago de donación...");
    globalWindow.Pi.createPayment(
      {
        amount,
        memo,
        metadata: { tipo: "donacion", app: "Arcana Tarot" }
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[Pi Payments] Fase 2: Pago pre-generado. ID:", paymentId);
          callbacks?.onApprovalRequested?.(paymentId);

          try {
            await approvePaymentOnBackend(paymentId, username, amount, memo);
            callbacks?.onApprovalSuccess?.();
          } catch (error: any) {
            callbacks?.onApprovalError?.(error.message);
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[Pi Payments] Fase 3: Transacción firmada. TXID:", txid.substring(0, 10) + "...");
          callbacks?.onCompletionStart?.();

          try {
            await completePaymentOnBackend(paymentId, txid);
            callbacks?.onCompletionSuccess?.();
          } catch (error: any) {
            callbacks?.onCompletionError?.(error.message);
          }
        },

        onCancel: (paymentId: string) => {
          console.log("[Pi Payments] Usuario canceló el pago:", paymentId);
          callbacks?.onCancelled?.(paymentId);
        },

        onError: (error: any) => {
          console.error("[Pi Payments] Error en pago:", error);
          callbacks?.onError?.(error?.message || "Error desconocido");
        }
      }
    );
  } catch (error: any) {
    console.error("[Pi Payments] Error general:", error);
    callbacks?.onError?.(error.message);
    throw error;
  }
}
