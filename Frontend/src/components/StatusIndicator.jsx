import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';

const StatusIndicator = ({ status, resultsCount, validResultsCount }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Búsqueda en espera...';
      case 'processing':
        return 'Procesando búsqueda y validando contactos...';
      case 'completed':
        return `Búsqueda completada: ${resultsCount} contactos encontrados (${validResultsCount} únicos)`;
      case 'failed':
        return 'Error al procesar la búsqueda. Por favor intenta nuevamente.';
      default:
        return 'Estado desconocido';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6 animate-slide-up">
      <div className={`status-badge ${STATUS_COLORS[status]} border-2 px-6 py-4 rounded-xl shadow-md flex items-center gap-3`}>
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {STATUS_LABELS[status]}
          </div>
          <div className="text-sm mt-1">
            {getStatusMessage()}
          </div>
        </div>
        {status === 'processing' && (
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
