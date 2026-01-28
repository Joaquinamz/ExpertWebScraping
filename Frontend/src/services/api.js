import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para agregar logs de requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Servicios de búsquedas
export const searchService = {
  // Crear nueva búsqueda
  createSearch: async (searchData) => {
    const response = await apiClient.post('/searches', {
      session_id: `web-${Date.now()}`,
      keywords: searchData.keywords,
      area: searchData.area,
      region: searchData.region,
      search_config: {
        source: 'web-frontend',
        max_results: 100
      }
    });
    return response.data;
  },

  // Obtener todas las búsquedas
  getSearches: async (params = {}) => {
    const response = await apiClient.get('/searches', { params });
    return response.data;
  },

  // Obtener búsqueda específica
  getSearchById: async (searchId) => {
    const response = await apiClient.get(`/searches/${searchId}`);
    return response.data;
  },

  // Obtener resultados de una búsqueda
  getSearchResults: async (searchId, params = {}) => {
    const response = await apiClient.get(`/searches/${searchId}/results`, {
      params: {
        only_valid: true,
        skip: 0,
        limit: 1000,
        ...params
      }
    });
    return response.data;
  },

  // Actualizar estado de búsqueda
  updateSearchStatus: async (searchId, status) => {
    const response = await apiClient.patch(`/searches/${searchId}/status`, { status });
    return response.data;
  },

  // Eliminar búsqueda
  deleteSearch: async (searchId) => {
    const response = await apiClient.delete(`/searches/${searchId}`);
    return response.data;
  }
};

// Servicios de contactos
export const contactService = {
  // Obtener todos los contactos
  getContacts: async (params = {}) => {
    const response = await apiClient.get('/contacts', {
      params: {
        min_validation_score: 0.6,
        skip: 0,
        limit: 1000,
        ...params
      }
    });
    return response.data;
  },

  // Obtener contacto específico
  getContactById: async (contactId) => {
    const response = await apiClient.get(`/contacts/${contactId}`);
    return response.data;
  },

  // Crear nuevo contacto
  createContact: async (contactData) => {
    const response = await apiClient.post('/contacts', contactData);
    return response.data;
  },

  // Actualizar contacto
  updateContact: async (contactId, contactData) => {
    const response = await apiClient.put(`/contacts/${contactId}`, contactData);
    return response.data;
  },

  // Eliminar contacto
  deleteContact: async (contactId) => {
    const response = await apiClient.delete(`/contacts/${contactId}`);
    return response.data;
  }
};

// Servicios de estadísticas
export const statsService = {
  // Obtener resumen general
  getSummary: async () => {
    const response = await apiClient.get('/stats/summary');
    return response.data;
  },

  // Obtener estadísticas de búsquedas
  getSearchStats: async () => {
    const response = await apiClient.get('/stats/searches');
    return response.data;
  },

  // Obtener estadísticas de contactos
  getContactStats: async () => {
    const response = await apiClient.get('/stats/contacts');
    return response.data;
  },

  // Obtener top contactos
  getTopContacts: async (limit = 10) => {
    const response = await apiClient.get('/stats/top-contacts', {
      params: { limit }
    });
    return response.data;
  }
};

// Utilidades
export const apiUtils = {
  // Verificar estado del API
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  // Manejo de errores
  handleError: (error) => {
    if (error.response) {
      // Error de respuesta del servidor
      return {
        message: error.response.data?.detail || 'Error en el servidor',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Error de red
      return {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
        status: 0,
        data: null
      };
    } else {
      // Error general
      return {
        message: error.message || 'Error desconocido',
        status: -1,
        data: null
      };
    }
  }
};

export default apiClient;
