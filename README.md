# Expert Finder - Buscador Automático de Expertos

Sistema de búsqueda automática de contactos expertos con validación inteligente.

## 🚀 Características

- **Backend**: FastAPI + MySQL
- **Frontend**: React + Vite + TailwindCSS
- **Demo Mode**: Generación automática de datos de prueba
- **Validación**: Sistema de scoring automático de calidad de contactos
- **Multi-select**: Búsqueda por múltiples áreas y regiones
- **Estadísticas**: Panel en tiempo real con métricas del sistema

## 📋 Requisitos

- Python 3.12+
- Node.js 18+
- MySQL 8.0+

## 🛠️ Instalación

### Backend

```bash
cd Backend2
pip install -r requirements.txt
```

Configura la base de datos en `Backend2/app/config.py`:
```python
DB_HOST: str = "localhost"
DB_PORT: int = 3306
DB_USER: str = "root"
DB_PASSWORD: str = "tu_contraseña"
DB_NAME: str = "expert_finder_db"
```

Ejecuta el script SQL para crear las tablas:
```bash
mysql -u root -p expert_finder_db < Backend2/database/00_setup_all.sql
```

Inicia el backend:
```bash
python run.py
```

El backend estará disponible en http://localhost:8081

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

El frontend estará disponible en http://localhost:3000

## 📚 Documentación API

Una vez iniciado el backend, accede a:
- **Swagger UI**: http://localhost:8081/docs
- **ReDoc**: http://localhost:8081/redoc

## 🎯 Uso

1. Accede a http://localhost:3000
2. Ingresa palabras clave para la búsqueda
3. Selecciona áreas y/o regiones (opcional)
4. Haz clic en "Buscar Expertos"
5. Revisa los resultados con scoring de calidad

## 🗂️ Estructura del Proyecto

```
WebScraping/
├── Backend2/           # Backend FastAPI (funcional)
│   ├── app/
│   │   ├── models/     # Modelos SQLAlchemy
│   │   ├── routers/    # Endpoints de la API
│   │   ├── schemas/    # Schemas Pydantic
│   │   ├── services/   # Lógica de negocio
│   │   └── utils/      # Utilidades y validadores
│   ├── database/       # Scripts SQL
│   └── requirements.txt
├── Frontend/           # Frontend React
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── services/   # Cliente API
│   │   └── constants/  # Configuración
│   └── package.json
└── README.md
```

## 🔧 Configuración

### Variables de Entorno (opcional)

Crea un archivo `.env` en `Backend2/`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=expert_finder_db
DEMO_MODE=True
```

### Modo Demo

Por defecto está activado (`DEMO_MODE=True`), genera datos de prueba automáticamente.

## 📝 Notas

- La carpeta `Backend/` (original) está excluida por estar en estado defectuoso
- `Backend2/` es la versión limpia y funcional
- Puerto backend: 8081
- Puerto frontend: 3000

## 🐛 Troubleshooting

**Error de conexión a MySQL:**
- Verifica que MySQL esté corriendo
- Confirma las credenciales en `config.py`
- Asegúrate de que la base de datos `expert_finder_db` exista

**Error CORS:**
- Verifica que el backend esté corriendo en puerto 8081
- Recarga el frontend con Ctrl+Shift+R

## 📄 Licencia

Proyecto privado - Todos los derechos reservados
