# ==========================================
# ETAPA 1: BUILDER (Compilación y optimización)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos solo los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Usamos 'npm ci' en lugar de 'npm install' (es más rápido y estricto para producción)
RUN npm ci

# Copiamos todo el código fuente del frontend
COPY . .

# Desactivamos telemetría de Next.js por privacidad y velocidad
ENV NEXT_TELEMETRY_DISABLED 1

# Compilamos la aplicación de producción (minifica código y pre-renderiza páginas)
RUN npm run build

# ==========================================
# ETAPA 2: RUNNER (Imagen liviana de producción)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Le avisamos a Node que estamos en producción
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copiamos los archivos compilados y dependencias necesarias desde la etapa de compilación
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Exponer el puerto por defecto de Next.js (3000)
EXPOSE 3000

# Comando para arrancar el servidor Next.js en producción
CMD ["npm", "run", "start"]