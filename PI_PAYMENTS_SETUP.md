# Implementación de Pagos Pi Network - Guía de Setup

## 📋 Resumen

La implementación de pagos Pi Network ha sido refactorizada en 3 módulos principales:

1. **`src/app/lib/pi-payments.ts`** - Utilidad de pagos (Frontend)
2. **`src/app/api/payments/approve/route.ts`** - Endpoint de aprobación (Backend)
3. **`src/app/api/payments/complete/route.ts`** - Endpoint de completación (Backend)

## 🚀 Flujo de Pagos (3 Fases)

```
Usuario hace click "Donar Pi"
         ↓
[Fase 1] Crear Pago en Cliente
  → window.Pi.createPayment()
         ↓
[Fase 2] Aprobación en Backend
  → POST /api/payments/approve
  → Pi API: /v2/payments/{paymentId}/approve
         ↓
[Fase 3] Completación en Backend
  → POST /api/payments/complete
  → Pi API: /v2/payments/{paymentId}/complete
         ↓
✅ Pago Finalizado
```

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega a tu `.env.local`:

```env
# Pi Network API Key (Obtén del Developer Portal: develop.pi)
PI_API_KEY=your_server_api_key_here
```

### 2. Developer Portal Setup

1. Accede a **develop.pi** en tu Pi Browser
2. Crea tu aplicación
3. Configura las URLs autorizadas (HTTPS obligatorio):
   - **App URL**: `https://tudominio.com`
4. Obtén tu **Server API Key**
5. Guarda la clave en `.env.local`

## 📝 Uso en Componentes

### Selector Page (Frontend)

```typescript
import { initializePiSdk, createDonation } from "@/app/lib/pi-payments";

// Pre-inicializar SDK en background (opcional)
useEffect(() => {
  initializePiSdk().catch(e => console.error("Error:", e));
}, []);

// Crear donación
const handleDonate = async () => {
  await createDonation(0.1, "Donación", {
    onApprovalSuccess: () => console.log("Aprobado"),
    onCompletionSuccess: () => alert("¡Gracias!"),
    onError: (err) => alert(`Error: ${err}`)
  });
};
```

## 🗄️ Integración con Base de Datos

En `src/app/api/payments/complete/route.ts`, después de la validación con Pi Network:

```typescript
// Guardar donación en tu base de datos
await DB.saveDonation({
  paymentId,
  txid,
  amount: piData.amount,
  status: "completed",
  createdAt: new Date()
});
```

## 🧪 Modo Sandbox vs Producción

### Detección Automática

```typescript
// El SDK detecta automáticamente:
- Pi Browser → sandbox: false (Red real: Testnet/Mainnet)
- Navegador común → sandbox: true (Modo simulado)
```

### Testing sin Pi Browser

1. Abre la app en Chrome/Safari
2. El SDK activará `sandbox: true` automáticamente
3. Usa la billetera simulada para probar flujos

### Testing en Pi Browser

1. Abre desde el Pi Browser en tu teléfono
2. El SDK detecta `sandbox: false`
3. Conecta a Testnet o Mainnet

## 📞 Callbacks Disponibles

```typescript
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
```

## ✅ Checklist de Deploy

- [ ] Agregar `PI_API_KEY` en `.env`
- [ ] URL HTTPS configurada en develop.pi
- [ ] Endpoints `/api/payments/approve` y `/api/payments/complete` accesibles
- [ ] Lógica de base de datos en `complete/route.ts` implementada
- [ ] Testing en Pi Browser completado
- [ ] Montos correctos configurados (0.1 para donación)

## 🐛 Troubleshooting

### "SDK de Pi no disponible"
- ✅ Abre en Pi Browser (no en navegador de escritorio)
- ✅ Verifica que HTTPS esté habilitado
- ✅ Verifica la URL en develop.pi

### "Cannot create a payment without 'payments' scope"
- ✅ El SDK autentica automáticamente con scope "payments"
- ✅ Si falla, revisa que `authenticateUser()` se ejecute primero

### Error en aprobación backend
- ✅ Verifica que `PI_API_KEY` sea correcto en `.env`
- ✅ Verifica que la URL en `develop.pi` sea exacta (sin subdominios incorrectos)

## 📂 Estructura de Archivos Refactorizada

```
src/
├── app/
│   ├── api/
│   │   └── payments/
│   │       ├── approve/route.ts        ✨ NUEVO
│   │       └── complete/route.ts       ✨ NUEVO
│   ├── lib/
│   │   ├── pi-payments.ts              ✨ NUEVO (Principal)
│   │   └── pi-network.ts               ⚠️ DEPRECADO (Solo stub)
│   └── selector/
│       └── page.tsx                    ✏️ ACTUALIZADO
└── components/
    └── PiNetworkInitializer.tsx        ❌ ELIMINADO
```

## 🔐 Notas de Seguridad

- ✅ La `PI_API_KEY` **nunca** se expone al frontend
- ✅ Solo el backend puede aprobar/completar pagos
- ✅ El frontend solo maneja `window.Pi` para crear pagos
- ✅ Valida `paymentId` y `txid` en todos los endpoints

---

**Última actualización**: Refactorización completa del SDK Pi Network v2.0
