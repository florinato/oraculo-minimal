🔮 Oráculo de Morvan - Tarot Mini App
Aplicación web interactiva y "Mobile-First" diseñada para integrarse como Mini App en plataformas Web3 (Pi Network) y Telegram. Ofrece lecturas de Tarot personalizadas usando un modelo de Inteligencia Artificial en Streaming.
🚀 Características Principales
Experiencia Inmersiva 3D: Uso avanzado de CSS (Perspectiva y Transformaciones) para simular un tapete de tarot real. Diseñado con unidades relativas (vh) para mantener la geometría perfecta en cualquier dispositivo móvil.
IA en Tiempo Real (SSE): Conexión con backend en Python (Google Cloud) utilizando Server-Sent Events para mostrar la lectura letra a letra (Efecto máquina de escribir).
Bypass de CORS Seguro: Implementación de un Proxy (Route Handler) en Next.js para ocultar los tokens de API y evitar bloqueos de seguridad en el navegador.
Internacionalización (i18n): Arquitectura basada en diccionarios JSON (src/locals/) preparada para escalar a múltiples idiomas sin alterar la lógica de los componentes.
Tipado Estricto: Código 100% TypeScript, libre de tipos any, optimizado para despliegues seguros en Vercel.
🛠️ Stack Tecnológico
Framework: Next.js 15 (App Router)
Motor: Webpack (Turbopack desactivado por estabilidad con dependencias nativas en Windows)
Lenguaje: TypeScript
Estilos: Tailwind CSS v4
Iconos & Markdown: Lucide React, React-Markdown
📁 Estructura del Proyecto
code
Text
oraculo-minimal/
├── public/                 # Assets locales (vidente_desk.jpg, mesa_lectura.jpg)
├── src/
│   ├── app/
│   │   ├── api/chat/       # Proxy API para conectar con Google Cloud (IA)
│   │   ├── lectura/        # Página de la tirada (Mesa 3D y Streaming)
│   │   ├── layout.tsx      # Configuración base y fuentes (Playfair, Inter)
│   │   └── page.tsx        # Landing Page (Captación de pregunta)
│   ├── components/
│   │   └── CardDetail.tsx  # Modal UI para visualizar la descripción de las cartas
│   ├── lib/
│   │   ├── i18n.ts         # Gestor de idiomas dinámico
│   │   └── tarot-api.ts    # Lógica de la baraja y URL builder para el Image Server
│   └── locals/
│       └── es.json         # Diccionario de traducciones y descripciones del oráculo
└── types/
    └── tarot.ts            # Interfaces TypeScript globales
⚙️ Variables de Entorno (.env)
Para ejecutar el proyecto localmente o en Vercel, es obligatorio configurar estas variables. El archivo .env está ignorado en Git por seguridad.
code
Env
# URL del backend de Inteligencia Artificial (Python/GCloud)
NEXT_PUBLIC_CHAT_API_URL=https://tarot-backcloud-xxxxxx.run.app

# Token secreto para validar las peticiones en el backend de IA
FRONTEND_API_SECRET=mi_token_super_secreto_123

# URL del servidor externo de imágenes de las cartas
NEXT_PUBLIC_ASSETS_URL=https://celta-assets-server-xxxxxx.run.app

# Token público para descargar las imágenes del servidor
NEXT_PUBLIC_IMAGE_SERVER_TOKEN=token_de_imagenes_aqui
💻 Instalación y Desarrollo Local
Clonar el repositorio:
code
Bash
git clone https://github.com/TU_USUARIO/oraculo-minimal.git
cd oraculo-minimal
Instalar dependencias:
code
Bash
npm install
Crear el archivo .env en la raíz con las variables indicadas arriba.
Iniciar el servidor de desarrollo:
code
Bash
npm run dev
La aplicación estará disponible en http://localhost:3000
☁️ Despliegue en Vercel
Importar el repositorio desde el panel de Vercel.
En la sección Settings > Environment Variables, añadir las 4 variables del archivo .env.
Iniciar el despliegue (Deploy).
(Nota: La aplicación está configurada en next.config.ts para permitir el uso seguro de etiquetas <img> externas en lugar de <Image /> debido a la manipulación dinámica de CSS 3D).