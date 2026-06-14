declare global {
  interface Window {
    Pi?: any;
  }
}

export interface PiUser {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (payment: any) => void;
  onReadyForServerCompletion: (payment: any) => void;
  onCancel: () => void;
  onError: (error: any) => void;
}

let piSdk: any = null;

const PI_APP_ID = "v0lst1mewqaxecp72qzp2iu1pugi33cdszf8oh87adnpcxf0euzlhdxlnv9sfkj3";

/**
 * Inicializa el SDK de Pi Network
 * @param config - Configuración del SDK
 */
export async function initPiNetwork(config?: {
  version?: string;
  sandbox?: boolean;
}): Promise<any> {
  if (typeof window === "undefined") {
    console.error("[Pi Network] No estamos en el navegador");
    return null;
  }

  // Verificar si Pi ya está disponible globalmente
  if (window.Pi) {
    piSdk = window.Pi;
    console.log("[Pi Network] SDK ya cargado globalmente");
    return piSdk;
  }

  // Cargar el script de Pi Network
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      // Inicializar Pi después de que el script se cargue
      if (window.Pi) {
        piSdk = window.Pi;
        piSdk.init({
          version: config?.version || "2.0",
          sandbox: config?.sandbox !== false,
          appId: PI_APP_ID,
        });
        console.log("[Pi Network] SDK inicializado correctamente");
        resolve(piSdk);
      } else {
        reject(new Error("Pi Network SDK no se pudo cargar"));
      }
    };

    script.onerror = () => {
      reject(new Error("Error al cargar el script de Pi Network"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Autentica al usuario con Pi Network
 */
export async function authenticateUser(): Promise<PiUser | null> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return null;
  }

  try {
    const scopes = ["payments"];
    const user: PiUser = await piSdk.authenticate(scopes);
    console.log("[Pi Network] Usuario autenticado:", user);
    return user;
  } catch (error) {
    console.error("[Pi Network] Error en autenticación:", error);
    return null;
  }
}

/**
 * Obtiene el usuario actual autenticado
 */
export async function getCurrentUser(): Promise<PiUser | null> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return null;
  }

  try {
    const user: PiUser = await piSdk.me();
    console.log("[Pi Network] Usuario actual:", user);
    return user;
  } catch (error) {
    console.error("[Pi Network] Error obteniendo usuario:", error);
    return null;
  }
}

/**
 * Crea una solicitud de pago
 * @param amount - Cantidad en Pi
 * @param memo - Descripción del pago
 * @param metadata - Metadatos adicionales
 * @param callbacks - Callbacks para manejar diferentes etapas
 */
export async function createPaymentRequest(
  amount: number,
  memo: string,
  metadata?: any,
  callbacks?: PiPaymentCallbacks
): Promise<any> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return null;
  }

  try {
    const paymentRequest = {
      amount,
      memo,
      metadata: metadata || {},
    };

    piSdk.requestPayment(
      paymentRequest,
      {
        onReadyForServerApproval: (payment: any) => {
          console.log("[Pi Network] Pago listo para aprobación del servidor:", payment);
          callbacks?.onReadyForServerApproval?.(payment);
        },
        onReadyForServerCompletion: (payment: any) => {
          console.log("[Pi Network] Pago listo para completar:", payment);
          callbacks?.onReadyForServerCompletion?.(payment);
        },
        onCancel: () => {
          console.log("[Pi Network] Pago cancelado");
          callbacks?.onCancel?.();
        },
        onError: (error: any) => {
          console.error("[Pi Network] Error en pago:", error);
          callbacks?.onError?.(error);
        },
      }
    );

    return paymentRequest;
  } catch (error) {
    console.error("[Pi Network] Error creando solicitud de pago:", error);
    return null;
  }
}

/**
 * Completa un pago
 * @param paymentId - ID del pago
 * @param txid - ID de transacción (hash)
 */
export async function completePayment(
  paymentId: string,
  txid: string
): Promise<boolean> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return false;
  }

  try {
    await piSdk.completePayment(paymentId, txid);
    console.log("[Pi Network] Pago completado:", paymentId);
    return true;
  } catch (error) {
    console.error("[Pi Network] Error completando pago:", error);
    return false;
  }
}

/**
 * Cancela un pago
 * @param paymentId - ID del pago
 */
export async function cancelPayment(paymentId: string): Promise<boolean> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return false;
  }

  try {
    await piSdk.cancelPayment(paymentId);
    console.log("[Pi Network] Pago cancelado:", paymentId);
    return true;
  } catch (error) {
    console.error("[Pi Network] Error cancelando pago:", error);
    return false;
  }
}

/**
 * Obtiene el saldo de Pi del usuario
 */
export async function getPiBalance(): Promise<number | null> {
  if (!piSdk) {
    console.warn("[Pi Network] SDK no inicializado");
    return null;
  }

  try {
    const user: PiUser = await piSdk.me();
    // El saldo se obtiene a través de otros métodos específicos
    console.log("[Pi Network] Usuario consultado para balance");
    return null; // Implementar según la respuesta real del SDK
  } catch (error) {
    console.error("[Pi Network] Error obteniendo saldo:", error);
    return null;
  }
}
