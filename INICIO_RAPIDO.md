# 🚀 Guía de Inicio Rápido - Expert Finder

## Paso 1: Iniciar Backend

Abre una terminal y ejecuta:

```bash
cd c:/Users/HAZ/Desktop/WebScraping/Backend

# Activar entorno virtual (si usas uno)
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Iniciar servidor FastAPI
python run.py
```

✅ El backend debe estar corriendo en: **http://localhost:8080**
✅ Verifica en: http://localhost:8080/docs (Swagger UI)

---

## Paso 2: Iniciar Frontend

Abre **OTRA** terminal y ejecuta:

```bash
cd c:/Users/HAZ/Desktop/WebScraping/Frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

✅ El frontend estará disponible en: **http://localhost:3000**

---

## Paso 3: Usar la Aplicación

1. Abre tu navegador en **http://localhost:3000**

2. Verás un formulario de búsqueda centrado con diseño azulado

3. Completa el formulario:
   - **Palabras clave** (obligatorio): Ej. "desarrollador python", "médico", "arquitecto"
   - **Área** (opcional): Selecciona de la lista desplegable
   - **Región** (opcional): Selecciona región de Chile

4. Haz click en **"Buscar Expertos"**

5. Observa el indicador de estado:
   - 🟡 **Pendiente**: Búsqueda en cola
   - 🔵 **Procesando**: Buscando y validando contactos
   - 🟢 **Completado**: ¡Resultados listos!
   - 🔴 **Error**: Algo salió mal

6. Cuando termine, verás la tabla de resultados con:
   - Todos los contactos encontrados
   - Scores de validación
   - Información completa (email, teléfono, organización, etc.)

7. Usa los filtros:
   - 🔍 Buscar en resultados (texto libre)
   - 📍 Filtrar por región
   - ⭐ Filtrar por score mínimo
   - 🔢 Cambiar cantidad por página (10, 20, 50, 100)

8. Exporta los resultados:
   - Click en **"📥 Exportar a CSV"**
   - Se descargará un archivo `.csv` con todos los datos
   - Compatible con Excel

---

## ⚠️ Troubleshooting

### ❌ "API Desconectada" en la interfaz

**Causa**: El backend no está corriendo

**Solución**:
```bash
cd Backend
python run.py
```

Verifica que veas: "Uvicorn running on http://0.0.0.0:8080"

---

### ❌ Error de CORS en consola del navegador

**Causa**: CORS no configurado correctamente

**Solución**: Verifica en `Backend/app/main.py` que tengas:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

### ❌ Búsqueda se queda en "Procesando"

**Causa**: En modo DEMO, la búsqueda se simula con timeouts

**Comportamiento normal**: 
- 1 segundo → pasa a "Procesando"
- 5 segundos → pasa a "Completado"

**En producción**: n8n hará scraping real y actualizará el estado automáticamente

---

### ❌ No aparecen resultados

**Causa**: La base de datos está vacía

**Solución temporal**: Inserta datos de prueba:

```bash
cd Backend
mysql -u root -p expert_finder_db < database/test_data_scoring.sql
```

---

## 🎨 Características de la UI

### Diseño Azulado Moderno
- Degradados azul-índigo-púrpura
- Cards con sombras suaves
- Animaciones de entrada
- Hover effects

### Formulario Centrado
- Foco visual en la búsqueda
- Validación en tiempo real
- Mensajes de error claros
- Tooltips informativos

### Tabla Responsive
- Se adapta a móviles y tablets
- Scroll horizontal si es necesario
- Ordenamiento por columnas
- Paginación completa

### Indicadores Visuales
- Barras de progreso para scores
- Badges de colores por estado
- Iconos intuitivos (Lucide React)
- Loading spinners

---

## 📊 Estadísticas en Vivo

En la barra superior verás:
- 📈 **Búsquedas realizadas**: Total histórico
- 👥 **Contactos válidos**: Score > 0.6
- 💾 **Total en BD**: Todos los contactos

Estas se actualizan automáticamente después de cada búsqueda.

---

## 🔥 Tips de Uso

### Palabras Clave Efectivas
✅ **Buenas**: "desarrollador python senior", "médico pediatra", "arquitecto proyectos"
❌ **Malas**: "persona", "trabajo", "Chile"

### Filtros Combinados
Puedes combinar:
- Búsqueda de texto + Filtro de región + Filtro de score
- Ejemplo: Buscar "universidad" + Región "Metropolitana" + Score ≥ 0.8

### Exportación Inteligente
El CSV incluye:
- Metadata de la búsqueda (fecha, keywords, filtros)
- Todos los datos de contacto
- Scores de validación y relevancia
- URLs de fuentes
- Compatible con Excel (UTF-8 BOM)

---

## 🎯 Próximos Pasos

1. **Probar la aplicación** con diferentes búsquedas
2. **Revisar el código** en `/Frontend/src/`
3. **Personalizar** colores en `tailwind.config.js`
4. **Integrar** con n8n para scraping real
5. **Agregar** autenticación de usuarios

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que ambos servidores estén corriendo
2. Revisa la consola del navegador (F12)
3. Revisa logs del backend
4. Consulta `Frontend/README.md` para más detalles

---

## ✅ Checklist de Verificación

Antes de comenzar, asegúrate de tener:

- [ ] Python 3.10+ instalado
- [ ] Node.js 18+ instalado
- [ ] MySQL 8.0 corriendo
- [ ] Base de datos `expert_finder_db` creada
- [ ] Tablas creadas (scripts 2.1 a 2.5)
- [ ] Backend corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 3000
- [ ] Navegador moderno (Chrome, Firefox, Edge, Safari)

---

**¡Listo para usar! 🚀**
