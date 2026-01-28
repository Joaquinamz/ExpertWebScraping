import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Exporta resultados a archivo CSV
 * @param {Array} results - Array de resultados a exportar
 * @param {String} filename - Nombre del archivo (opcional)
 */
export const exportToCSV = (results, filename = null) => {
  if (!results || results.length === 0) {
    alert('No hay resultados para exportar');
    return;
  }

  // Definir columnas del CSV
  const headers = [
    'Nombre',
    'Email',
    'Teléfono',
    'Organización',
    'Cargo',
    'Región',
    'Score de Validación',
    'Score de Relevancia',
    'URL del Perfil',
    'Fuente',
    'Fecha de Obtención'
  ];

  // Función para escapar valores CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Si contiene coma, comillas o salto de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Formatear fecha para CSV
  const formatDateForCSV = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Crear filas de datos
  const rows = results.map(result => [
    escapeCSV(result.contact_name || ''),
    escapeCSV(result.contact_email || ''),
    escapeCSV(result.contact_phone || ''),
    escapeCSV(result.organization || ''),
    escapeCSV(result.position || ''),
    escapeCSV(result.contact_region || ''),
    escapeCSV(result.validation_score ? result.validation_score.toFixed(2) : ''),
    escapeCSV(result.relevance_score ? result.relevance_score.toFixed(2) : ''),
    escapeCSV(result.profile_url || ''),
    escapeCSV(result.source_name || ''),
    formatDateForCSV(result.found_at)
  ]);

  // Combinar headers y filas
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Agregar BOM para soporte de caracteres especiales en Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Crear enlace de descarga
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generar nombre de archivo
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const defaultFilename = `resultados_busqueda_${timestamp}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar memoria
  URL.revokeObjectURL(url);
  
  console.log(`✅ Exportados ${results.length} resultados a ${filename || defaultFilename}`);
};

/**
 * Exporta búsqueda completa con metadata
 * @param {Object} searchData - Datos de la búsqueda
 * @param {Array} results - Resultados de la búsqueda
 */
export const exportSearchWithMetadata = (searchData, results) => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `busqueda_${searchData.keywords.replace(/\s+/g, '_').substring(0, 30)}_${timestamp}.csv`;
  
  // Agregar metadata como comentarios al inicio del CSV
  const metadata = [
    `# Expert Finder - Resultados de Búsqueda`,
    `# Fecha de exportación: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}`,
    `# Palabras clave: ${searchData.keywords}`,
    `# Área: ${searchData.area || 'Todas'}`,
    `# Región: ${searchData.region || 'Todas'}`,
    `# Total de resultados: ${results.length}`,
    `#`,
    ``
  ].join('\n');

  // Definir columnas del CSV
  const headers = [
    'Nombre',
    'Email',
    'Teléfono',
    'Organización',
    'Cargo',
    'Región',
    'Score de Validación',
    'Score de Relevancia',
    'URL del Perfil',
    'Fuente',
    'Fecha de Obtención'
  ];

  // Función para escapar valores CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Formatear fecha
  const formatDateForCSV = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Crear filas
  const rows = results.map(result => [
    escapeCSV(result.contact_name || ''),
    escapeCSV(result.contact_email || ''),
    escapeCSV(result.contact_phone || ''),
    escapeCSV(result.organization || ''),
    escapeCSV(result.position || ''),
    escapeCSV(result.contact_region || ''),
    escapeCSV(result.validation_score ? result.validation_score.toFixed(2) : ''),
    escapeCSV(result.relevance_score ? result.relevance_score.toFixed(2) : ''),
    escapeCSV(result.profile_url || ''),
    escapeCSV(result.source_name || ''),
    formatDateForCSV(result.found_at)
  ]);

  // Combinar todo
  const csvContent = metadata + [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Crear Blob y descargar
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  console.log(`✅ Exportados ${results.length} resultados con metadata a ${filename}`);
  return filename;
};
