import React, { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, TrendingUp, Users, Database, ScrollText, AlertTriangle, CheckCircle2, Clock3, Contact } from 'lucide-react';
import SearchForm from './components/SearchForm';
import StatusIndicator from './components/StatusIndicator';
import ResultsTable from './components/ResultsTable';
import { searchService, contactService, statsService, apiUtils } from './services/api';
import { exportSearchWithMetadata } from './utils/exportCSV';

// Array de imágenes de fondo
const backgroundImages = [
  '/images/bg1.jpg',
  '/images/bg2.jpg',
  '/images/bg3.jpg',
  '/images/bg4.jpg',
  '/images/bg5.jpg',
  '/images/bg6.jpg',
  '/images/bg7.jpg',
  '/images/bg8.jpg',
  '/images/bg9.jpg',
  '/images/bg10.png'
];

const normalizeSearchStatus = (backendStatus) => {
  if (backendStatus === 'pending' || backendStatus === 'running' || backendStatus === 'processing') {
    return 'processing';
  }
  if (backendStatus === 'error' || backendStatus === 'failed') {
    return 'failed';
  }
  return backendStatus;
};

const inferRegionFromText = (...values) => {
  const text = values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const rules = [
    { region: 'Arica y Parinacota', keys: ['arica y parinacota', 'arica', 'parinacota'] },
    { region: 'Tarapacá', keys: ['tarapacá', 'tarapaca', 'iquique'] },
    { region: 'Antofagasta', keys: ['antofagasta'] },
    { region: 'Atacama', keys: ['atacama', 'copiapó', 'copiapo'] },
    { region: 'Coquimbo', keys: ['coquimbo', 'la serena'] },
    { region: 'Valparaíso', keys: ['valparaíso', 'valparaiso', 'viña del mar', 'vina del mar', 'quilpué', 'quilpue', 'concón', 'concon'] },
    { region: 'Santiago', keys: ['santiago', 'metropolitana', 'rm', 'providencia', 'las condes', 'ñuñoa', 'nunoa'] },
    { region: "O'Higgins", keys: ["o'higgins", 'ohiggins', 'rancagua'] },
    { region: 'Maule', keys: ['maule', 'talca'] },
    { region: 'Ñuble', keys: ['ñuble', 'nuble', 'chillán', 'chillan'] },
    { region: 'Biobío', keys: ['biobío', 'biobio', 'concepción', 'concepcion'] },
    { region: 'La Araucanía', keys: ['la araucanía', 'la araucania', 'araucanía', 'araucania', 'temuco'] },
    { region: 'Los Ríos', keys: ['los ríos', 'los rios', 'valdivia'] },
    { region: 'Los Lagos', keys: ['los lagos', 'puerto montt'] },
    { region: 'Aysén', keys: ['aysén', 'aysen', 'coihaique', 'coyhaique'] },
    { region: 'Magallanes', keys: ['magallanes', 'punta arenas'] },
  ];

  for (const rule of rules) {
    if (rule.keys.some((keyword) => text.includes(keyword))) {
      return rule.region;
    }
  }

  return null;
};

const canonicalizeRegion = (regionValue) => {
  const normalized = (regionValue || '').toString().trim().toLowerCase();
  if (!normalized) return null;

  const regionMap = {
    'arica y parinacota': 'Arica y Parinacota',
    arica: 'Arica y Parinacota',
    parinacota: 'Arica y Parinacota',
    'tarapacá': 'Tarapacá',
    tarapaca: 'Tarapacá',
    iquique: 'Tarapacá',
    antofagasta: 'Antofagasta',
    atacama: 'Atacama',
    'copiapó': 'Atacama',
    copiapo: 'Atacama',
    coquimbo: 'Coquimbo',
    'la serena': 'Coquimbo',
    'valparaíso': 'Valparaíso',
    valparaiso: 'Valparaíso',
    santiago: 'Santiago',
    metropolitana: 'Santiago',
    rm: 'Santiago',
    "o'higgins": "O'Higgins",
    ohiggins: "O'Higgins",
    rancagua: "O'Higgins",
    maule: 'Maule',
    talca: 'Maule',
    'ñuble': 'Ñuble',
    nuble: 'Ñuble',
    'chillán': 'Ñuble',
    chillan: 'Ñuble',
    'biobío': 'Biobío',
    biobio: 'Biobío',
    'bío bío': 'Biobío',
    'bio bio': 'Biobío',
    'la araucanía': 'La Araucanía',
    'la araucania': 'La Araucanía',
    'araucanía': 'La Araucanía',
    araucania: 'La Araucanía',
    temuco: 'La Araucanía',
    'los ríos': 'Los Ríos',
    'los rios': 'Los Ríos',
    valdivia: 'Los Ríos',
    'los lagos': 'Los Lagos',
    'puerto montt': 'Los Lagos',
    'aysén': 'Aysén',
    aysen: 'Aysén',
    coihaique: 'Aysén',
    coyhaique: 'Aysén',
    magallanes: 'Magallanes',
    'punta arenas': 'Magallanes',
  };

  return regionMap[normalized] || regionValue;
};

const formatSafeDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  try {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

const normalizeResultRegion = (result) => {
  const inferredRegion = inferRegionFromText(
    result?.source_url,
    result?.contact_organization,
    result?.organization,
    result?.contact_name,
    result?.contact_position
  );

  const finalRegion = canonicalizeRegion(inferredRegion || result?.contact_region || result?.region || null);

  return {
    ...result,
    contact_region: finalRegion,
    region: finalRegion,
  };
};

  const normalizeContactRegion = (contact) => {
    // Para contactos guardados en BD, NO inferimos región de la URL.
    // Confiamos solo en lo que está guardado en la BD.
    const finalRegion = canonicalizeRegion(contact?.contact_region || contact?.region || null);
    return {
      ...contact,
      contact_region: finalRegion,
      region: finalRegion,
    };
  };

class SafePanelBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Error en panel UI:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          Ocurrió un error al renderizar el panel. Cierra y vuelve a abrir.
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [searchState, setSearchState] = useState({
    currentSearch: null,
    results: [],
    status: null,
    isSearching: false,
    error: null
  });

  const [stats, setStats] = useState({
    totalSearches: 0,
    totalContacts: 0,
    validContacts: 0
  });

  const [apiConnected, setApiConnected] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const [showContactsPanel, setShowContactsPanel] = useState(false);
  const [contactsSearchTerm, setContactsSearchTerm] = useState('');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [logsState, setLogsState] = useState({
    items: [],
    loading: false,
    error: null
  });
  const [contactsState, setContactsState] = useState({
    items: [],
    loading: false,
    error: null
  });
  const contactsPageSize = 20;

  const asText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  };

  const safeDisplay = (value, fallback = 'N/A') => {
    const text = asText(value).trim();
    return text || fallback;
  };

  const safeContacts = (Array.isArray(contactsState.items) ? contactsState.items : []).filter(
    (item) => item && typeof item === 'object'
  );

  const contactsExportResults = safeContacts.map((contact) => {
    const parsedScore = Number(contact?.validation_score);
    const safeScore = Number.isFinite(parsedScore) ? parsedScore : 0;
    const name = asText(contact?.name).trim() || 'Sin nombre';
    const email = asText(contact?.email).trim() || null;
    const organization = asText(contact?.organization).trim() || null;
    const position = asText(contact?.position).trim() || null;
    const region = canonicalizeRegion(asText(contact?.region).trim()) || null;
    const phone = asText(contact?.phone).trim() || null;
    const sourceUrl = asText(contact?.source_url).trim() || null;
    const sourceType = asText(contact?.source_type).trim() || 'db_contact';
    const foundAt = asText(contact?.created_at).trim() || new Date().toISOString();

    return {
      contact_id: contact?.id,
      contact_name: name,
      contact_email: email,
      contact_organization: organization,
      organization,
      contact_position: position,
      position,
      contact_region: region,
      region,
      contact_phone: phone,
      phone,
      source_url: sourceUrl,
      source_type: sourceType,
      relevance_score: safeScore,
      validation_score: safeScore,
      found_at: foundAt
    };
  });

  const filteredContacts = useMemo(() => {
    const term = contactsSearchTerm.trim().toLowerCase();
    if (!term) return safeContacts;

    return safeContacts.filter((contact) => {
      const searchableText = [
        contact?.name,
        contact?.email,
        contact?.organization,
        contact?.position,
        contact?.region,
        contact?.phone,
        contact?.source_type,
      ]
        .map(asText)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [safeContacts, contactsSearchTerm]);

  const loadRecentLogs = async () => {
    try {
      setLogsState(prev => ({ ...prev, loading: true, error: null }));
      const params = {
        limit: 30
      };

      if (searchState.currentSearch?.id) {
        params.search_id = searchState.currentSearch.id;
      }

      const response = await searchService.getRecentLogs(params);
      setLogsState({
        items: response.items || [],
        loading: false,
        error: null
      });
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setLogsState({
        items: [],
        loading: false,
        error: errorInfo.message
      });
    }
  };

  useEffect(() => {
    if (showLogsPanel) {
      loadRecentLogs();
    }
  }, [showLogsPanel, searchState.currentSearch?.id]);

  const loadAllContacts = async () => {
    try {
      setContactsState(prev => ({ ...prev, loading: true, error: null }));
      const response = await contactService.getContacts({
        only_valid: false,
        min_validation_score: 0,
        limit: 1000
      });

      const normalizedContacts = (response.items || []).map((contact) => ({
        ...contact,
        region: canonicalizeRegion(contact?.region)
      }));

      setContactsState({
        items: normalizedContacts,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setContactsState({
        items: [],
        loading: false,
        error: errorInfo.message
      });
    }
  };

  useEffect(() => {
    if (showContactsPanel) {
      loadAllContacts();
    }
  }, [showContactsPanel]);

  const getLogVisualState = (logItem) => {
    const hasError = !!logItem.error_message && (
      (logItem.status || '').toLowerCase().includes('error') ||
      (logItem.search_status || '').toLowerCase().includes('error')
    );

    if (hasError) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        bg: 'bg-red-50 border-red-200'
      };
    }

    const hasResults = (logItem.contacts_found || 0) > 0;
    if (hasResults) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        bg: 'bg-green-50 border-green-200'
      };
    }

    return {
      icon: <Clock3 className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200'
    };
  };

  // Rotar imágenes de fondo cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Verificar conexión con API al montar
  useEffect(() => {
    checkApiConnection();
    loadStats();
  }, []);

  // Polling para actualizar estado de búsqueda
  useEffect(() => {
    let pollInterval;
    
    if (searchState.currentSearch && searchState.status === 'processing') {
      console.log('🔄 Iniciando polling para búsqueda ID:', searchState.currentSearch.id);
      pollInterval = setInterval(async () => {
        try {
          const updatedSearch = await searchService.getSearchById(searchState.currentSearch.id);
          const normalizedStatus = normalizeSearchStatus(updatedSearch.status);
          console.log('📡 Polling - Estado backend:', updatedSearch.status, 'Estado UI:', normalizedStatus, 'Resultados:', updatedSearch.results_count);
          
          if (normalizedStatus !== searchState.status) {
            console.log('🔔 Cambio de estado detectado:', searchState.status, '->', normalizedStatus);
            setSearchState(prev => ({
              ...prev,
              status: normalizedStatus,
              currentSearch: updatedSearch
            }));

            // Si completó, cargar resultados
            if (normalizedStatus === 'completed') {
              console.log('✅ Búsqueda completada, cargando resultados...');
              await loadSearchResults(updatedSearch.id);
              
              // Recargar la búsqueda actualizada para obtener contadores correctos
              const finalSearch = await searchService.getSearchById(updatedSearch.id);
              console.log('📊 Búsqueda final:', finalSearch);
              
              setSearchState(prev => ({ 
                ...prev, 
                isSearching: false,
                currentSearch: finalSearch
              }));
              await loadStats();
            } else if (normalizedStatus === 'failed') {
              console.log('❌ Búsqueda falló');
              setSearchState(prev => ({
                ...prev,
                isSearching: false,
                error: 'La búsqueda falló. Por favor intenta nuevamente.'
              }));
            }
          }
        } catch (error) {
          console.error('Error polling search status:', error);
        }
      }, 3000); // Poll cada 3 segundos
    }

    return () => {
      if (pollInterval) {
        console.log('🛑 Deteniendo polling');
        clearInterval(pollInterval);
      }
    };
  }, [searchState.currentSearch, searchState.status]);

  // Verificar conexión con API
  const checkApiConnection = async () => {
    const connected = await apiUtils.healthCheck();
    setApiConnected(connected);
    
    if (!connected) {
      console.warn('⚠️ No se pudo conectar con el API. Verifica que el backend esté corriendo en http://localhost:8081');
    } else {
      console.log('✅ Conectado al API correctamente');
    }
  };

  // Cargar estadísticas generales
  const loadStats = async () => {
    try {
      const summary = await statsService.getSummary();
      setStats({
        totalSearches: summary.total_searches || 0,
        totalContacts: summary.total_contacts || 0,
        validContacts: summary.valid_contacts || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Cargar resultados de una búsqueda
  const loadSearchResults = async (searchId) => {
    try {
      console.log('🔍 Cargando resultados para búsqueda ID:', searchId);
      const response = await searchService.getSearchResults(searchId, {
        only_valid: false,  // Traer TODOS los contactos, el filtro frontend los maneja
        limit: 1000
      });
      
      console.log('📦 Respuesta recibida:', response);
      console.log('📋 Resultados:', response.results);
      console.log('📊 Total resultados:', response.results?.length || 0);
      
      const searchResults = (response.results || []).map(normalizeResultRegion);

      if (searchResults.length > 0) {
        setSearchState(prev => ({
          ...prev,
          results: searchResults
        }));

        console.log('✅ Estado actualizado con', searchResults.length, 'resultados');
        return;
      }

      console.warn('⚠️ Sin resultados por búsqueda, activando fallback a /contacts para demo');
      const contactsResponse = await contactService.getContacts({
        only_valid: true,
        min_validation_score: 0.6,
        limit: 1000
      });

        const fallbackResults = (contactsResponse.items || []).map((contact) => normalizeContactRegion({
        contact_id: contact.id,
        contact_name: contact.name,
        contact_email: contact.email,
        contact_organization: contact.organization,
        organization: contact.organization,
        contact_position: contact.position,
        position: contact.position,
        contact_region: contact.region,
        region: contact.region,
        contact_phone: contact.phone,
        phone: contact.phone,
        source_url: contact.source_url,
        source_type: contact.source_type,
        relevance_score: Number(contact.validation_score || 0),
        validation_score: Number(contact.validation_score || 0),
        found_at: contact.created_at
      }));

      setSearchState(prev => ({
        ...prev,
        results: fallbackResults,
        error: fallbackResults.length === 0
          ? 'La búsqueda terminó sin resultados enlazados y tampoco hay contactos globales para mostrar.'
          : null
      }));

      console.log('✅ Fallback cargó', fallbackResults.length, 'contactos desde /contacts');
    } catch (error) {
      console.error('❌ Error loading search results:', error);
      const errorInfo = apiUtils.handleError(error);
      setSearchState(prev => ({
        ...prev,
        error: errorInfo.message
      }));
    }
  };

  // Manejar nueva búsqueda
  const handleSearch = async (formData) => {
    setSearchState({
      currentSearch: null,
      results: [],
      status: 'pending',
      isSearching: true,
      error: null
    });

    try {
      // Crear búsqueda en el backend (DEMO_MODE procesará automáticamente)
      const newSearch = await searchService.createSearch(formData);
      console.log('🆕 Búsqueda creada:', newSearch);
      const normalizedInitialStatus = normalizeSearchStatus(newSearch.status);
      
      setSearchState(prev => ({
        ...prev,
        currentSearch: newSearch,
        status: normalizedInitialStatus
      }));

      // Si ya está completada (modo DEMO puede ser muy rápido), cargar inmediatamente
      if (normalizedInitialStatus === 'completed') {
        console.log('⚡ Búsqueda ya completada, cargando resultados inmediatamente');
        await loadSearchResults(newSearch.id);
        setSearchState(prev => ({ ...prev, isSearching: false }));
        await loadStats();
      } else {
        // El backend en modo DEMO procesará automáticamente la búsqueda
        // El polling actualizará el estado cuando esté listo
        console.log('⏳ Esperando procesamiento en backend...');
      }

    } catch (error) {
      console.error('Error creating search:', error);
      const errorInfo = apiUtils.handleError(error);
      
      setSearchState({
        currentSearch: null,
        results: [],
        status: 'failed',
        isSearching: false,
        error: errorInfo.message
      });
    }
  };

  // Manejar exportación
  const handleExport = (resultsToExport) => {
    if (!searchState.currentSearch) {
      alert('No hay búsqueda activa para exportar');
      return;
    }

    try {
      const filename = exportSearchWithMetadata(
        {
          keywords: searchState.currentSearch.keywords,
          area: searchState.currentSearch.area,
          region: searchState.currentSearch.region
        },
        resultsToExport
      );
      
      // Mostrar notificación de éxito
      alert(`✅ Exportación exitosa: ${resultsToExport.length} contactos guardados en ${filename}`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('❌ Error al exportar. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo animado con imágenes */}
      <div className="fixed inset-0 -z-10">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBgIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              animation: index === currentBgIndex ? 'zoomOut 8s ease-out forwards' : 'none'
            }}
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${image})`,
                transform: 'scale(1.1)'
              }}
            />
            {/* Overlay para mejor legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70" />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white/75 backdrop-blur-md border-b-2 border-blue-100/50 shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                <SearchIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Expert Finder
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de búsqueda y validación de expertos
                </p>
              </div>
            </div>

            {/* Indicador de conexión */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm text-gray-600">
                {apiConnected ? 'API Conectada' : 'API Desconectada'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Formulario de búsqueda */}
        {!searchState.currentSearch && (
          <SearchForm 
            onSearch={handleSearch}
            isSearching={searchState.isSearching}
          />
        )}

        {/* Indicador de estado */}
        {searchState.status && (
          <div className="mt-8">
            <StatusIndicator
              status={searchState.status}
              resultsCount={searchState.currentSearch?.results_count || 0}
              validResultsCount={searchState.currentSearch?.valid_results_count || 0}
            />
          </div>
        )}

        {/* Error */}
        {searchState.error && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-red-700 text-sm">{safeDisplay(searchState.error, 'Error desconocido')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de resultados */}
        {searchState.results.length > 0 && (
          <div className="mt-8">
            <ResultsTable
              results={searchState.results}
              onExport={handleExport}
            />
          </div>
        )}

        {/* Nueva búsqueda (botón) */}
        {searchState.currentSearch && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setSearchState({
                  currentSearch: null,
                  results: [],
                  status: null,
                  isSearching: false,
                  error: null
                });
              }}
              className="btn-secondary"
            >
              🔍 Nueva Búsqueda
            </button>
          </div>
        )}
      </main>

      {/* Botón fijo superior derecho: contactos en BD */}
      <button
        onClick={() => setShowContactsPanel(true)}
        className="fixed top-6 right-6 px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 z-50"
        title="Ver todos los contactos almacenados"
      >
        <Contact className="w-4 h-4" />
        Contactos BD
      </button>

      {/* Botón flotante de estadísticas */}
      <button
        onClick={() => setShowStatsPanel(!showStatsPanel)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        title="Ver estadísticas"
      >
        <Database className="w-6 h-6" />
      </button>

      {/* Panel de contactos almacenados en BD */}
      {showContactsPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setShowContactsPanel(false)}
          />

          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[88vw] max-w-[1200px] h-[80vh] bg-slate-50 rounded-xl shadow-2xl z-50 border-2 border-indigo-200 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Contactos almacenados en base de datos</h3>
                  <p className="text-xs text-white/90">Total cargado: {safeContacts.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      exportSearchWithMetadata(
                        {
                          keywords: 'contactos almacenados en base de datos',
                          area: 'Todos',
                          region: 'Todas'
                        },
                        contactsExportResults
                      );
                    }}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={loadAllContacts}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={() => setShowContactsPanel(false)}
                    className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto">
              <SafePanelBoundary>
              {contactsState.loading && (
                <div className="text-sm text-gray-500">Cargando contactos...</div>
              )}

              {contactsState.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {safeDisplay(contactsState.error, 'Error al cargar contactos')}
                </div>
              )}

              {!contactsState.loading && !contactsState.error && safeContacts.length === 0 && (
                <div className="text-sm text-gray-500">No hay contactos almacenados.</div>
              )}

              {!contactsState.loading && !contactsState.error && safeContacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={contactsSearchTerm}
                      onChange={(event) => setContactsSearchTerm(event.target.value)}
                      placeholder="Buscar por nombre, email, organización, cargo o región..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {filteredContacts.length} resultado(s)
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Nombre</th>
                          <th className="text-left px-3 py-2 font-semibold">Email</th>
                          <th className="text-left px-3 py-2 font-semibold">Organización</th>
                          <th className="text-left px-3 py-2 font-semibold">Cargo</th>
                          <th className="text-left px-3 py-2 font-semibold">Región</th>
                          <th className="text-left px-3 py-2 font-semibold">Score</th>
                          <th className="text-left px-3 py-2 font-semibold">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => {
                          const score = Number(contact?.validation_score);
                          const safeScore = Number.isFinite(score) ? score.toFixed(2) : '0.00';
                          const sourceUrl = asText(contact?.source_url || '').trim();

                          return (
                            <tr key={contact?.id || `${asText(contact?.email)}-${asText(contact?.name)}`} className="border-t border-slate-100">
                              <td className="px-3 py-2">{asText(contact?.name) || 'Sin nombre'}</td>
                              <td className="px-3 py-2">{asText(contact?.email) || 'N/A'}</td>
                              <td className="px-3 py-2">{asText(contact?.organization) || 'N/A'}</td>
                              <td className="px-3 py-2">{asText(contact?.position) || 'N/A'}</td>
                              <td className="px-3 py-2">{asText(canonicalizeRegion(contact?.region)) || 'N/A'}</td>
                              <td className="px-3 py-2">{safeScore}</td>
                              <td className="px-3 py-2">
                                {sourceUrl ? (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold truncate"
                                    title={sourceUrl}
                                  >
                                    Ir →
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </SafePanelBoundary>
            </div>
          </div>
        </>
      )}

      {/* Botón flotante de logs */}
      <button
        onClick={() => setShowLogsPanel(!showLogsPanel)}
        className="fixed bottom-24 right-6 w-11 h-11 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        title="Ver logs"
      >
        <ScrollText className="w-5 h-5" />
      </button>

      {/* Panel flotante de logs */}
      {showLogsPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setShowLogsPanel(false)}
          />

          <div className="fixed bottom-20 right-24 w-[420px] max-h-[520px] bg-white rounded-xl shadow-2xl z-50 animate-slide-up border-2 border-slate-200 flex flex-col">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Logs del flujo</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadRecentLogs}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={() => setShowLogsPanel(false)}
                    className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              {logsState.loading && (
                <div className="text-sm text-gray-500">Cargando logs...</div>
              )}

              {logsState.error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {safeDisplay(logsState.error, 'Error al cargar logs')}
                </div>
              )}

              {!logsState.loading && !logsState.error && logsState.items.length === 0 && (
                <div className="text-sm text-gray-500">No hay logs disponibles.</div>
              )}

              {!logsState.loading && !logsState.error && logsState.items.map((logItem) => {
                const visual = getLogVisualState(logItem);

                return (
                  <div
                    key={logItem.id}
                    className={`border rounded-lg p-3 ${visual.bg}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{visual.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-600 mb-1">
                          #{logItem.search_id} · {new Date(logItem.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {safeDisplay(logItem.search_keywords, 'Sin keywords')}
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          Estado: {safeDisplay(logItem.search_status, 'n/a')} · Contactos: {safeDisplay(logItem.contacts_found, '0')}
                        </div>
                        {logItem.error_message && (
                          <div className="text-xs text-gray-700 mt-1 break-words">
                            {safeDisplay(logItem.error_message, 'Error sin detalle')}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-500 mt-1 truncate">
                          {safeDisplay(logItem.source_type, 'source')} · {safeDisplay(logItem.source_url, 'sin origen')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Panel de estadísticas flotante */}
      {showStatsPanel && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setShowStatsPanel(false)}
          />
          
          {/* Panel */}
          <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl z-50 animate-slide-up border-2 border-blue-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Estadísticas del Sistema</h3>
                <button
                  onClick={() => setShowStatsPanel(false)}
                  className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800">{stats.totalSearches}</div>
                  <div className="text-sm text-gray-600">Búsquedas realizadas</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800">{stats.validContacts}</div>
                  <div className="text-sm text-gray-600">Contactos válidos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800">{stats.totalContacts}</div>
                  <div className="text-sm text-gray-600">Total en base de datos</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-white/75 backdrop-blur-md border-t-2 border-blue-100/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>
              Expert Finder v1.0 - Sistema de búsqueda de expertos con validación automática
            </p>
            <p className="mt-2">
              Desarrollado con React + FastAPI + MySQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
