# 1. Traemos la "computadora virtual" con Node.js instalado
FROM node:20-alpine

# 2. Creamos la carpeta /app y nos metemos ahí
WORKDIR /app

# 3. Copiamos la lista de dependencias
COPY package*.json ./

# 4. Descargamos las librerías de internet (React, Tailwind, etc.)
RUN npm install

# 5. ACÁ COPIAMOS TU CÓDIGO: El primer "." es tu PC, el segundo "." es el contenedor. Copia todo.
COPY . .

# 6. Abrimos el puerto 3000 para que lo veas en tu navegador
EXPOSE 3000

# 7. Le damos "Play" al entorno de desarrollo
CMD ["npm", "run", "dev"]