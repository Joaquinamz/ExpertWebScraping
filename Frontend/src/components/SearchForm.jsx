import React, { useState } from 'react';
import { Search, Sparkles, MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { AREA_OPTIONS, REGION_OPTIONS } from '../constants';
// import Autocomplete from './Autocomplete'; // Temporalmente deshabilitado

const SearchForm = ({ onSearch, isSearching }) => {
  const [formData, setFormData] = useState({
    keywords: '',
    areas: [],
    regions: []
  });

  const [errors, setErrors] = useState({});
  const [showAreas, setShowAreas] = useState(false);
  const [showRegions, setShowRegions] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelectToggle = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.keywords.trim()) {
      newErrors.keywords = 'Las palabras clave son obligatorias';
    } else if (formData.keywords.trim().length < 3) {
      newErrors.keywords = 'Ingresa al menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convertir arrays a strings separados por comas para el backend
      const searchData = {
        keywords: formData.keywords,
        area: formData.areas.join(', ') || '',
        region: formData.regions.join(', ') || ''
      };
      onSearch(searchData);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 animate-slide-up">
      <div className="bg-white/50 backdrop-blur-md rounded-xl shadow-xl border border-blue-100/50 overflow-visible p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Buscador de Expertos
          </h2>
          <p className="text-gray-600">
            Encuentra profesionales y especialistas en diversas áreas
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de palabras clave */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Palabras clave *
              </div>
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="Ej: desarrollador python, arquitecto, médico pediatra..."
              className={`input-field ${errors.keywords ? 'border-red-400 focus:ring-red-500' : ''}`}
              disabled={isSearching}
            />
            {errors.keywords && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.keywords}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              💡 Tip: Sé específico para obtener mejores resultados
            </p>
          </div>

          {/* Selectores en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selector de Área - Múltiple */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Área / Categoría
                </div>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAreas(!showAreas)}
                  className="input-field w-full flex items-center justify-between"
                  disabled={isSearching}
                >
                  <span className="text-gray-700">
                    {formData.areas.length === 0 
                      ? 'Todas las áreas' 
                      : `${formData.areas.length} área(s) seleccionada(s)`}
                  </span>
                  {showAreas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showAreas && (
                  <div className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {AREA_OPTIONS.filter(opt => opt.value !== '').map(option => (
                      <label
                        key={option.value}
                        className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.areas.includes(option.value)}
                          onChange={() => handleMultiSelectToggle('areas', option.value)}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={isSearching}
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.areas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.areas.map(area => (
                    <span key={area} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {AREA_OPTIONS.find(opt => opt.value === area)?.label}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectToggle('areas', area)}
                        className="ml-1 hover:text-blue-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Región - Múltiple */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Región / Ubicación
                </div>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRegions(!showRegions)}
                  className="input-field w-full flex items-center justify-between"
                  disabled={isSearching}
                >
                  <span className="text-gray-700">
                    {formData.regions.length === 0 
                      ? 'Todas las regiones' 
                      : `${formData.regions.length} región(es) seleccionada(s)`}
                  </span>
                  {showRegions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showRegions && (
                  <div className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {REGION_OPTIONS.filter(opt => opt.value !== '').map(option => (
                      <label
                        key={option.value}
                        className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.regions.includes(option.value)}
                          onChange={() => handleMultiSelectToggle('regions', option.value)}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={isSearching}
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.regions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.regions.map(region => (
                    <span key={region} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {REGION_OPTIONS.find(opt => opt.value === region)?.label}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectToggle('regions', region)}
                        className="ml-1 hover:text-blue-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón de búsqueda */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar Expertos
                  </>
                )}
              </span>
              {!isSearching && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              )}
            </button>
          </div>
        </form>

        {/* Nota informativa */}
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Nota:</span> Los resultados se obtienen de múltiples fuentes 
            y son validados automáticamente. El proceso puede tomar algunos segundos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
