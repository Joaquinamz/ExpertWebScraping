# Expert Finder - Frontend

Frontend React para el sistema de búsqueda y validación de expertos.

## 🚀 Características

- **Interfaz moderna** con Tailwind CSS y diseño azulado
- **Formulario de búsqueda** centrado con campos de:
  - Palabras clave (requerido)
  - Área/Categoría (opcional)
  - Región/Ubicación (opcional)
- **Indicador de estado** en tiempo real (pendiente, procesando, completado, error)
- **Tabla de resultados** con:
  - Ordenamiento por cualquier columna
  - Filtros dinámicos por región y score
  - Búsqueda en tiempo real
  - Paginación completa
  - Exportación a CSV con metadata
- **Estadísticas** en tiempo real del sistema
- **Responsive design** para móviles y escritorio

## 📋 Requisitos

- Node.js 18+ 
- npm 9+
- Backend corriendo en `http://localhost:8080`

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 🌐 Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Proxy de desarrollo

El proyecto está configurado para usar proxy automático en `vite.config.js`:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

## 📂 Estructura del Proyecto

```
Frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes React
│   │   ├── SearchForm.jsx      # Formulario de búsqueda
│   │   ├── StatusIndicator.jsx # Indicador de estado
│   │   └── ResultsTable.jsx    # Tabla de resultados
│   ├── services/           # Servicios API
│   │   └── api.js              # Cliente Axios + endpoints
│   ├── utils/              # Utilidades
│   │   └── exportCSV.js        # Exportación a CSV
│   ├── constants/          # Constantes
│   │   └── index.js            # Áreas, regiones, estados
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Entry point
│   └── index.css           # Estilos globales
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎨 Tecnologías Utilizadas

- **React 18.2** - Framework UI
- **Vite 5.0** - Build tool
- **Tailwind CSS 3.4** - Estilos utility-first
- **Axios 1.6** - Cliente HTTP
- **Lucide React** - Iconos modernos
- **date-fns 3.2** - Manejo de fechas

## 🔌 Integración con Backend

### Endpoints utilizados

- `POST /api/v1/searches` - Crear nueva búsqueda
- `GET /api/v1/searches/{id}` - Obtener búsqueda
- `GET /api/v1/searches/{id}/results` - Obtener resultados
- `PATCH /api/v1/searches/{id}/status` - Actualizar estado
- `GET /api/v1/stats/summary` - Obtener estadísticas

### Flujo de búsqueda

1. Usuario completa formulario
2. POST a `/searches` crea registro
3. Polling cada 3s para verificar estado
4. Cuando status = 'completed', cargar resultados
5. Mostrar tabla con filtros y exportación

## 📊 Funcionalidades

### Formulario de Búsqueda

- Validación en tiempo real
- Tooltips informativos
- Disabled durante búsqueda activa
- Animaciones suaves

### Tabla de Resultados

- **Ordenamiento**: Click en cualquier columna
- **Filtros**:
  - Búsqueda de texto global
  - Filtro por región
  - Filtro por score mínimo
- **Paginación**: 10, 20, 50 o 100 resultados por página
- **Exportación**: CSV con metadata y timestamp

### Indicador de Estado

- **Pendiente** (amarillo): Búsqueda en cola
- **Procesando** (azul): Scraping activo
- **Completado** (verde): Resultados listos
- **Error** (rojo): Falló el proceso

## 🎯 Uso

### Iniciar aplicación

```bash
# Terminal 1: Iniciar backend
cd Backend
python run.py

# Terminal 2: Iniciar frontend
cd Frontend
npm run dev
```

### Acceder

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/docs

### Realizar búsqueda

1. Ingresar palabras clave (ej: "desarrollador python")
2. Seleccionar área (opcional)
3. Seleccionar región (opcional)
4. Click en "Buscar Expertos"
5. Esperar resultados (5-10 segundos)
6. Filtrar y ordenar según necesidad
7. Exportar a CSV si es necesario

## 🐛 Troubleshooting

### Error: No se puede conectar con el API

```bash
# Verificar que backend esté corriendo
curl http://localhost:8080/

# Verificar logs del backend
# Debe mostrar: "Uvicorn running on http://0.0.0.0:8080"
```

### Error: CORS

Si ves errores de CORS en consola:

1. Verifica que el backend tenga CORS habilitado en `app/main.py`
2. Asegúrate de que `allow_origins=["*"]` está configurado

### Búsqueda no avanza de "Procesando"

Esto es normal en DEMO mode. En producción:

1. n8n recibirá el webhook
2. Hará scraping real
3. Insertará contactos via API
4. Estado cambiará a 'completed' automáticamente

## 📝 Próximas Funcionalidades

- [ ] Autenticación de usuarios
- [ ] Historial de búsquedas
- [ ] Exportación a Excel
- [ ] Gráficos de estadísticas
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Filtros guardados
- [ ] Comparación de búsquedas

## 🤝 Contribución

Este es un proyecto académico. Para mejoras:

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Proyecto académico - Universidad de Chile 2026

## 👨‍💻 Autor

Desarrollado como parte de la práctica profesional en Ingeniería de Software.
