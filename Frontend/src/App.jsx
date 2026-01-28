import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, TrendingUp, Users, Database } from 'lucide-react';
import SearchForm from './components/SearchForm';
import StatusIndicator from './components/StatusIndicator';
import ResultsTable from './components/ResultsTable';
import { searchService, statsService, apiUtils } from './services/api';
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
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

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
          console.log('📡 Polling - Estado actual:', updatedSearch.status, 'Resultados:', updatedSearch.results_count);
          
          if (updatedSearch.status !== searchState.status) {
            console.log('🔔 Cambio de estado detectado:', searchState.status, '->', updatedSearch.status);
            setSearchState(prev => ({
              ...prev,
              status: updatedSearch.status,
              currentSearch: updatedSearch
            }));

            // Si completó, cargar resultados
            if (updatedSearch.status === 'completed') {
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
            } else if (updatedSearch.status === 'failed') {
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
      
      setSearchState(prev => ({
        ...prev,
        results: response.results || []
      }));
      
      console.log('✅ Estado actualizado con', response.results?.length || 0, 'resultados');
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
      
      setSearchState(prev => ({
        ...prev,
        currentSearch: newSearch,
        status: newSearch.status === 'pending' ? 'processing' : newSearch.status
      }));

      // Si ya está completada (modo DEMO puede ser muy rápido), cargar inmediatamente
      if (newSearch.status === 'completed') {
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
                  <p className="text-red-700 text-sm">{searchState.error}</p>
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

      {/* Botón flotante de estadísticas */}
      <button
        onClick={() => setShowStatsPanel(!showStatsPanel)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        title="Ver estadísticas"
      >
        <Database className="w-6 h-6" />
      </button>

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
