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

# Configurado para puerto 3000 para coincidir con la configuración de Cloud Run
ENV PORT 3000
EXPOSE 3000

# Comando para arrancar en modo producción
# Asegúrate de que tu package.json tenga el script "start": "next start"
CMD ["npm", "start", "--", "-p", "3000"]