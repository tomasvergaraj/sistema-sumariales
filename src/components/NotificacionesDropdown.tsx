import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Check, CheckCheck, Scale, X } from 'lucide-react';
import { useNotificacionesRevision, NotificacionRevision } from '@/hooks/useNotificacionesRevision';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificacionesDropdown = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notificaciones,
    cantidadNoLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
  } = useNotificacionesRevision();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificacionClick = (notificacion: NotificacionRevision) => {
    marcarComoLeida(notificacion.id);
    setIsOpen(false);
    // Navegar a /procesos con query param para abrir el modal
    if (location.pathname === '/procesos') {
      // Ya estamos en /procesos, usar el evento de navegación para actualizar
      navigate(`/procesos?verProceso=${notificacion.procesoId}`, { replace: true });
    } else {
      navigate(`/procesos?verProceso=${notificacion.procesoId}`);
    }
  };

  const formatTiempoRelativo = (fecha: Date) => {
    return formatDistanceToNow(fecha, { addSuffix: true, locale: es });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} />
        {cantidadNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {cantidadNoLeidas > 9 ? '9+' : cantidadNoLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center space-x-2">
              <Scale className="text-indigo-600" size={18} />
              <h3 className="font-semibold text-indigo-900">Revisiones Jurídicas</h3>
            </div>
            <div className="flex items-center space-x-2">
              {cantidadNoLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={14} />
                  <span>Marcar leídas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-indigo-100 rounded transition-colors"
              >
                <X size={16} className="text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones recientes</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notificaciones.map((notificacion) => (
                  <li key={notificacion.id}>
                    <button
                      onClick={() => handleNotificacionClick(notificacion)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !notificacion.leida ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 p-1.5 rounded-lg ${
                          !notificacion.leida ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Scale size={14} className={
                            !notificacion.leida ? 'text-indigo-600' : 'text-gray-500'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${
                              !notificacion.leida ? 'text-indigo-900' : 'text-gray-900'
                            }`}>
                              Resolución {notificacion.numeroResolucion}
                            </p>
                            {!notificacion.leida && (
                              <span className="ml-2 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {notificacion.tipoRevision}
                            {notificacion.numeroMemo && (
                              <span className="text-gray-400"> - {notificacion.numeroMemo}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTiempoRelativo(notificacion.fechaRevision)}
                          </p>
                        </div>
                        {notificacion.leida && (
                          <Check size={14} className="text-green-500 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Mostrando revisiones de las últimas 48 horas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
