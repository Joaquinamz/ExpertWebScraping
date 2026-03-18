@echo off
REM Script de inicio rápido para Windows

echo 🚀 Iniciando WebScraping Expert Finder...

REM Verificar que existe el archivo .env
if not exist .env (
    echo ⚠️  No se encontro el archivo .env
    echo 📝 Copiando .env.example a .env...
    copy .env.example .env
    echo ✅ Archivo .env creado. Por favor, edita las variables de entorno antes de continuar.
    pause
    exit /b 1
)

REM Detener contenedores existentes
echo 🛑 Deteniendo contenedores existentes...
docker-compose down

REM Construir imágenes
echo 🏗️  Construyendo imagenes Docker...
docker-compose build --no-cache

REM Iniciar servicios
echo ▶️  Iniciando servicios...
docker-compose up -d

REM Esperar a que los servicios estén listos
echo ⏳ Esperando a que los servicios esten listos...
timeout /t 10 /nobreak

REM Verificar estado
echo.
echo 📊 Estado de los servicios:
docker-compose ps

echo.
echo ✅ Despliegue completado!
echo.
echo 🌐 Accede a los servicios en:
echo    Frontend:  http://localhost
echo    Backend:   http://localhost:8081/docs
echo    n8n:       http://localhost:5678
echo.
echo 📝 Ver logs: docker-compose logs -f
echo 🛑 Detener: docker-compose down
echo.
pause
