# Expert Finder

Sistema de búsqueda automática de contactos expertos mediante procesamiento web e integración con n8n.

## Características

- Backend FastAPI con API REST y validación de contactos
- Frontend React con búsqueda en tiempo real y resultados interactivos
- Base de datos MySQL con esquema completo de búsquedas y contactos
- Integración n8n para automatización de trabajos de web scraping
- Sistema de scoring para validación de calidad de contactos
- Docker Compose para despliegue completo

## Requisitos

- Docker y Docker Compose

## Inicio Rápido

1. Clonar el repositorio:
```bash
git clone https://github.com/Joaquinamz/ExpertWebScraping.git
cd ExpertWebScraping
```

2. Construir e iniciar los servicios:
```bash
docker compose build --no-cache
docker compose up -d
```

3. Acceder a los servicios:
- Frontend: http://localhost
- Backend API: http://localhost:8081
- Swagger API: http://localhost:8081/docs
- n8n: http://localhost:5678

## Estructura del Proyecto

Backend/
- app/: Aplicación FastAPI
  - models/: Modelos SQLAlchemy
  - routers/: Endpoints de API
  - schemas/: Validaciones Pydantic
  - services/: Lógica de negocio
  - utils/: Funciones auxiliares
- database/: Scripts SQL de inicialización

Frontend/
- src/: Aplicación React
  - components/: Componentes de UI
  - services/: Cliente API
  - utils/: Funciones auxiliares

n8n-workflows/
- n8nworkflow.json: Definición completa del workflow de automatización

## Configuración

El archivo .env contiene todas las variables necesarias para ejecutar los servicios. Los valores por defecto están preconfigurados para desarrollo local. Para cambiar credenciales o configuración, editar .env antes de ejecutar docker compose.

Variables principales:
- N8N_API_KEY, N8N_USER, N8N_PASSWORD: Credenciales de n8n
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD: Configuración MySQL
- CORS_ORIGINS: Orígenes permitidos para la API

## Flujo de Funcionamiento

1. El usuario ingresa criterios de búsqueda en el frontend
2. El backend crea un registro de búsqueda
3. n8n ejecuta el workflow para obtener contactos
4. Los resultados se almacenan en MySQL
5. El frontend consulta mediante polling hasta completar
6. Los resultados se muestran con scoring de validez

## API

El backend expone una API REST documentada en /docs (Swagger) o /redoc (ReDoc). Endpoints principales incluyen búsquedas, contactos, resultados y estadísticas del sistema.

## Licencia

Proyecto privado - Todos los derechos reservados
