// Opciones para el selector de Área/Categoría
export const AREA_OPTIONS = [
  { value: '', label: 'Todas las áreas' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Turismo', label: 'Turismo' },
  { value: 'Agricultura', label: 'Agricultura' },
  { value: 'Minería', label: 'Minería' },
  { value: 'Comercio', label: 'Comercio' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Industria', label: 'Industria' },
  { value: 'Finanzas', label: 'Finanzas' },
  { value: 'Arte y Cultura', label: 'Arte y Cultura' },
  { value: 'Deportes', label: 'Deportes' },
  { value: 'Medio Ambiente', label: 'Medio Ambiente' },
];

// Opciones para el selector de Región
export const REGION_OPTIONS = [
  { value: '', label: 'Todas las regiones' },
  { value: 'Arica y Parinacota', label: 'XV - Arica y Parinacota' },
  { value: 'Tarapacá', label: 'I - Tarapacá' },
  { value: 'Antofagasta', label: 'II - Antofagasta' },
  { value: 'Atacama', label: 'III - Atacama' },
  { value: 'Coquimbo', label: 'IV - Coquimbo' },
  { value: 'Valparaíso', label: 'V - Valparaíso' },
  { value: 'Santiago', label: 'RM - Santiago' },
  { value: "O'Higgins", label: "VI - O'Higgins" },
  { value: 'Maule', label: 'VII - Maule' },
  { value: 'Ñuble', label: 'XVI - Ñuble' },
  { value: 'Biobío', label: 'VIII - Biobío' },
  { value: 'La Araucanía', label: 'IX - La Araucanía' },
  { value: 'Los Ríos', label: 'XIV - Los Ríos' },
  { value: 'Los Lagos', label: 'X - Los Lagos' },
  { value: 'Aysén', label: 'XI - Aysén' },
  { value: 'Magallanes', label: 'XII - Magallanes' },
];

// Estados de búsqueda
export const SEARCH_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Mapeo de estados para UI
export const STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'En ejecución',
  completed: 'Finalizada',
  failed: 'Error'
};

// Colores para badges de estado
export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300'
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};
