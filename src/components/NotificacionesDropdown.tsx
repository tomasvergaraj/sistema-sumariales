import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, FileText, Clock, X } from 'lucide-react';
import { useNotificacionesGlobales } from '@/hooks/useNotificacionesGlobales';
import { NotificacionGlobal } from '@/types/notificaciones';


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
  } = useNotificacionesGlobales();
  ;

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

  const handleNotificacionClick = (notificacion: NotificacionGlobal) => {
    marcarComoLeida(notificacion.id, notificacion.tipo);
    setIsOpen(false);

    if (location.pathname === '/procesos') {
      navigate(`/procesos?verProceso=${notificacion.procesoId}`, { replace: true });
    } else {
      navigate(`/procesos?verProceso=${notificacion.procesoId}`);
    }
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
              <Bell className="text-indigo-600" size={18} />
              <h3 className="font-semibold text-indigo-900">Notificaciones</h3>
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
                        <div
                          className={`mt-1 p-1.5 rounded-lg ${
                            notificacion.tipo === 'plazo'
                              ? 'bg-red-100'
                              : !notificacion.leida
                              ? 'bg-indigo-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          {notificacion.tipo === 'revision' ? (
                            <FileText
                              size={14}
                              className={!notificacion.leida ? 'text-indigo-600' : 'text-gray-500'}
                            />
                          ) : (
                            <Clock
                              size={14}
                              className="text-red-600"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${
                              !notificacion.leida ? 'text-indigo-900' : 'text-gray-900'
                            }`}>
                              {notificacion.tipo === 'revision'
                                ? `Resolución ${notificacion.numeroResolucion}`
                                : 'Plazo vencido'}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600 mt-0.5">
                            {notificacion.tipo === 'revision' ? (
                              notificacion.tipoRevision
                            ) : (
                              <>
                                <span className="font-medium text-red-600">
                                  Plazo vencido:
                                </span>{' '}
                                {notificacion.nombrePlazo}
                              </>
                            )}

                            {notificacion.tipo === 'plazo' && (
                              <div className="text-xs text-gray-400 mt-1">
                                Proceso: {notificacion.nombreProceso}
                              </div>
                            )}
                          </div>
                        </div>
                        {notificacion.tipo === 'revision' ? (
                          <FileText size={14} className="text-indigo-400" />
                        ) : (
                          <Clock size={14} className="text-red-400" />
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
                Mostrando notificaciones recientes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
