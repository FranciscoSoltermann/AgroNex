# ==========================================
# ETAPA 1: BUILDER (Compilación y optimización)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias necesarias para algunos módulos nativos
RUN apk add --no-cache libc6-compat

# Copiamos package.json primero
COPY package*.json ./

# Instalación estricta
RUN npm ci

# Copiar el resto del código
COPY . .

# Desactivar telemetría
ENV NEXT_TELEMETRY_DISABLED 1

# Compilación (ahora generará una carpeta standalone gracias a next.config.mjs)
RUN npm run build

# ==========================================
# ETAPA 2: RUNNER (Imagen liviana de producción)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear un usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar carpeta public (imágenes, fuentes, etc.)
COPY --from=builder /app/public ./public

# Crear directorio para la cache de next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar SOLO los archivos standalone y estáticos generados por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario sin privilegios
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Ejecutar el servidor standalone directamente (mucho más rápido que npm run start)
CMD ["node", "server.js"]