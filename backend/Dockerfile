# ==========================================
# ETAPA 1: BUILDER (Compilación y optimización)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos solo los archivos de dependencias primero para aprovechar la caché
COPY package*.json ./

# Usamos 'npm ci' en lugar de 'npm install' (es más rápido y estricto para producción)
RUN npm ci

# Copiamos todo tu código (componentes, páginas, etc.)
COPY . .

# Le decimos a Next.js que construya la versión optimizada de producción
# Esto minifica el código y genera las páginas estáticas
RUN npm run build

# ==========================================
# ETAPA 2: PRODUCCIÓN (Imagen liviana)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Le avisamos a Node que estamos en producción (hace que todo corra más rápido)
ENV NODE_ENV production

# Copiamos SOLO lo necesario desde la Etapa 1 (dejamos atrás el código fuente sin compilar)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# En lugar de 'dev', ejecutamos 'start' (la versión compilada)
CMD ["npm", "run", "start"]