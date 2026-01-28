import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  ExternalLink, 
  Calendar,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ResultsTable = ({ results, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'validation_score', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    region: '',
    organization: '',
    minScore: 0.7
  });

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Filtro por búsqueda de texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(result => 
        result.contact_name?.toLowerCase().includes(term) ||
        result.contact_email?.toLowerCase().includes(term) ||
        result.organization?.toLowerCase().includes(term) ||
        result.position?.toLowerCase().includes(term) ||
        result.contact_region?.toLowerCase().includes(term)
      );
    }

    // Filtro por región
    if (filters.region) {
      filtered = filtered.filter(result => 
        result.contact_region === filters.region
      );
    }

    // Filtro por organización
    if (filters.organization) {
      filtered = filtered.filter(result => 
        result.organization?.toLowerCase().includes(filters.organization.toLowerCase())
      );
    }

    // Filtro por score mínimo
    if (filters.minScore > 0) {
      filtered = filtered.filter(result => 
        result.validation_score >= filters.minScore
      );
    }

    return filtered;
  }, [results, searchTerm, filters]);

  // Ordenar resultados
  const sortedResults = useMemo(() => {
    let sorted = [...filteredResults];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejo de valores null/undefined
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Comparación
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sorted;
  }, [filteredResults, sortConfig]);

  // Paginación
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedResults.slice(startIndex, startIndex + pageSize);
  }, [sortedResults, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedResults.length / pageSize);

  // Cambiar ordenamiento
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Obtener icono de ordenamiento
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4" /> : 
      <SortDesc className="w-4 h-4" />;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Obtener regiones únicas
  const uniqueRegions = useMemo(() => {
    const regions = results.map(r => r.contact_region).filter(Boolean);
    return [...new Set(regions)].sort();
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay resultados aún
          </h3>
          <p className="text-gray-500">
            Realiza una búsqueda para comenzar a encontrar expertos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 animate-slide-up">
      <div className="card">
        {/* Header con controles */}
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Resultados de Búsqueda
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {sortedResults.length} contacto{sortedResults.length !== 1 ? 's' : ''} encontrado{sortedResults.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <button
              onClick={() => onExport(sortedResults)}
              className="btn-secondary"
            >
              📥 Exportar a CSV
            </button>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda de texto */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar en resultados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por región */}
            <div>
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las regiones</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Filtro por score */}
            <div>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseFloat(e.target.value) }))}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0.7">Únicos (score ≥ 0.7)</option>
                <option value="0">Mostrar posibles duplicados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('contact_name')}
                >
                  <div className="flex items-center gap-2">
                    Nombre {getSortIcon('contact_name')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('organization')}
                >
                  <div className="flex items-center gap-2">
                    Organización {getSortIcon('organization')}
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Cargo
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Contacto
                </th>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('contact_region')}
                >
                  <div className="flex items-center gap-2">
                    Región {getSortIcon('contact_region')}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('validation_score')}
                >
                  <div className="flex items-center gap-2">
                    Score {getSortIcon('validation_score')}
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Fuente
                </th>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  onClick={() => handleSort('found_at')}
                >
                  <div className="flex items-center gap-2">
                    Fecha {getSortIcon('found_at')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {paginatedResults.map((result, index) => (
                <tr 
                  key={result.result_id || index}
                  className="hover:bg-blue-50 transition-colors"
                >
                  {/* Nombre */}
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">
                      {result.contact_name || 'Sin nombre'}
                    </div>
                  </td>

                  {/* Organización */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate max-w-xs">
                        {result.organization || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">
                      {result.position || 'N/A'}
                    </span>
                  </td>

                  {/* Contacto (Email y Teléfono) */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {result.contact_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <a 
                            href={`mailto:${result.contact_email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                          >
                            {result.contact_email}
                          </a>
                        </div>
                      )}
                      {result.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <a 
                            href={`tel:${result.contact_phone}`}
                            className="text-gray-700 hover:text-blue-600"
                          >
                            {result.contact_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Región */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">
                        {result.contact_region || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Score de validación */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {result.validation_score >= 0.7 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Smile className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {result.validation_score.toFixed(2)}
                          </span>
                        </div>
                      ) : result.validation_score >= 0.5 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Meh className="w-5 h-5 text-yellow-600" />
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            {result.validation_score.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Frown className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {result.validation_score.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Fuente */}
                  <td className="px-4 py-4">
                    {result.source_url ? (
                      <a
                        href={result.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {result.source_type || 'Ver perfil'}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(result.found_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-blue-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Info de página */}
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedResults.length)} de {sortedResults.length} resultados
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border-2 border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border-2 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border-2 border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de tamaño de página */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsTable;
