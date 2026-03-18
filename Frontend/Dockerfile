# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia el código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copia los archivos build al nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

# Comando por defecto de nginx
CMD ["nginx", "-g", "daemon off;"]
