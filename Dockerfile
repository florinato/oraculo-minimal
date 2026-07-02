# Usamos Node 20
FROM node:20-slim

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo las de desarrollo para el build)
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Construir la aplicación Next.js
# Esto genera la carpeta .next
RUN npm run build

# Cloud Run usa el puerto 8080 por defecto
ENV PORT 8080
EXPOSE 8080

# Comando para arrancar en modo producción
# Asegúrate de que tu package.json tenga el script "start": "next start"
CMD ["npm", "start", "--", "-p", "8080"]