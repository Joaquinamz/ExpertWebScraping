#!/bin/bash

# Script de inicio rápido para despliegue Docker
# chmod +x start.sh antes de ejecutar

set -e

echo "🚀 Iniciando WebScraping Expert Finder..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  No se encontró el archivo .env"
    echo "📝 Copiando .env.example a .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Por favor, edita las variables de entorno antes de continuar."
    echo "   nano .env"
    exit 1
fi

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Construir imágenes
echo "🏗️  Construyendo imágenes Docker..."
docker-compose build --no-cache

# Iniciar servicios
echo "▶️  Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🌐 Accede a los servicios en:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8081/docs"
echo "   n8n:       http://localhost:5678"
echo ""
echo "📝 Ver logs: docker-compose logs -f"
echo "🛑 Detener: docker-compose down"
