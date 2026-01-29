import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, X, Sparkles, TrendingUp, Plus } from 'lucide-react';
import { getContextualSuggestions, CATEGORY_LABELS } from '../constants/keywords';

const KeywordSuggestions = ({ onSelectKeyword, currentValue }) => {
  const [suggestions, setSuggestions] = useState({ category: null, suggestions: [] });
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowAllSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Actualizar sugerencias cuando cambia el input
  useEffect(() => {
    const result = getContextualSuggestions(currentValue);
    setSuggestions(result);
  }, [currentValue]);

  const handleSelectKeyword = (keyword) => {
    onSelectKeyword(keyword);
  };

  const getCategoryIcon = () => {
    if (!suggestions.category) return <TrendingUp size={14} className="text-gray-500" />;
    return <Sparkles size={14} className="text-purple-500" />;
  };

  const getCategoryMessage = () => {
    if (!suggestions.category) {
      if (!currentValue || currentValue.length < 3) {
        return 'Sugerencias generales';
      }
      return 'Sugerencias generales';
    }
    return `${CATEGORY_LABELS[suggestions.category] || suggestions.category}`;
  };

  // Las primeras 3 sugerencias que siempre están visibles
  const topSuggestions = suggestions.suggestions.slice(0, 3);
  // El resto de sugerencias que se muestran al expandir
  const restSuggestions = suggestions.suggestions.slice(3);

  return (
    <div className="space-y-2" ref={suggestionsRef}>
      {/* Siempre mostrar las 3 primeras sugerencias */}
      {topSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getCategoryIcon()}
            <span className="font-semibold">{getCategoryMessage()}</span>
            {suggestions.category && (
              <span className="text-purple-600">• Recomendado para ti</span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {topSuggestions.map((keyword, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectKeyword(keyword)}
                className={`group px-3 py-2 rounded-lg text-sm text-left transition-all
                           hover:shadow-md transform hover:scale-[1.02] flex items-center gap-2 ${
                  suggestions.category
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-blue-100'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Plus size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium">{keyword}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botón para ver más sugerencias */}
      {restSuggestions.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 
                     border border-blue-200 rounded-lg text-sm font-medium 
                     text-blue-700 hover:text-blue-800 transition-all hover:shadow-md"
          >
            <Lightbulb size={14} />
            {showAllSuggestions 
              ? `Ocultar ${restSuggestions.length} adicionales` 
              : `Ver ${restSuggestions.length} más`
            }
          </button>

          {/* Panel expandido con más sugerencias */}
          {showAllSuggestions && (
            <div className="bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 select-none overflow-x-hidden">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  {getCategoryIcon()}
                  Más Sugerencias
                </h4>
                <button
                  onClick={() => setShowAllSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mensaje de contexto detectado */}
              <div className={`mb-3 p-2 rounded-lg ${
                suggestions.category 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-xs font-medium flex items-center gap-2 ${
                  suggestions.category ? 'text-purple-700' : 'text-gray-600'
                }`}>
                  {suggestions.category && <Sparkles size={14} />}
                  {suggestions.category 
                    ? `Detectamos: ${CATEGORY_LABELS[suggestions.category]}`
                    : 'Escribe para obtener sugerencias específicas'
                  }
                </p>
              </div>

              {/* Grid de sugerencias adicionales */}
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto overflow-x-hidden">
                {restSuggestions.map((keyword, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectKeyword(keyword)}
                    className={`px-4 py-2.5 rounded-lg text-sm text-left transition-all
                               hover:shadow-md transform hover:scale-[1.01] flex items-center gap-2 w-full ${
                      suggestions.category
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-blue-100'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={14} className="opacity-50 flex-shrink-0" />
                    <span className="font-medium break-words">{keyword}</span>
                  </button>
                ))}
              </div>

              {/* Tip informativo */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  {suggestions.category ? (
                    <>
                      🎯 <strong>Sugerencias contextuales:</strong> Las recomendaciones se adaptan a lo que escribes
                    </>
                  ) : (
                    <>
                      💡 <strong>Tip:</strong> Escribe palabras como "programación", "médico" o "construcción" para obtener sugerencias específicas
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KeywordSuggestions;
