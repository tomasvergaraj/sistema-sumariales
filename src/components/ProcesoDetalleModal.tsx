import { useEffect, useState, useMemo } from 'react';
import { useProcesos } from '@/hooks/useProcesos';
import { useCiclosFiscal } from '@/hooks/useCiclosFiscal';
import { useAuthStore } from '@/context/authStore';
import { formatearFecha } from '@/hooks/usePlazos';
import { X, Calendar, User, FileText, CheckCircle, XCircle, Award, Scale, Send } from 'lucide-react';
import { ProcesoSumarial, EtapaProceso } from '@/types';
import { HistorialFiscal } from '@/components/HistorialFiscal';

interface ProcesoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: string;
}

export const ProcesoDetalleModal = ({ isOpen, onClose, procesoId }: ProcesoDetalleModalProps) => {
  const { procesos, forceRefresh, determinarEtapaAutomatica } = useProcesos();
  const { user } = useAuthStore();
  const [proceso, setProceso] = useState<ProcesoSumarial | null>(null);
  const { cicloActivo, ciclosAnteriores, loading: loadingCiclos, actualizarProrroga, eliminarProrroga, actualizarOrdinario, eliminarOrdinario } = useCiclosFiscal(procesoId, forceRefresh);

  useEffect(() => {
    if (procesoId && procesos.length > 0) {
      const foundProceso = procesos.find(p => p.id === procesoId);
      setProceso(foundProceso || null);
    }
  }, [procesoId, procesos]);

  // Calcular la etapa dinámicamente basándose en el ciclo activo actual
  const etapaActual: EtapaProceso = useMemo(() => {
    if (!proceso) return 'INDAGATORIA_VIGENTE';
    return determinarEtapaAutomatica(proceso, cicloActivo);
  }, [proceso, cicloActivo, determinarEtapaAutomatica]);

  if (!isOpen) return null;

  if (!proceso) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const getEtapaLabel = (etapa: string) => {
    switch (etapa) {
      case 'INDAGATORIA_VIGENTE':
        return 'Indagatoria Vigente';
      case 'INDAGATORIA_FUERA_PLAZO':
        return 'Indagatoria Fuera de Plazo';
      case 'CONCLUIDO':
        return 'Concluido';
      default:
        return etapa;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-text">Proceso Sumarial</h2>
            <p className="text-gray-600">Resolución {proceso.numero_resolucion}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    etapaActual === 'CONCLUIDO'
                      ? 'bg-purple-100'
                      : proceso.activo
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                  }`}>
                    {etapaActual === 'CONCLUIDO' ? (
                      <Award className="text-purple-600" size={24} />
                    ) : proceso.activo ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-gray-600" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-semibold text-text">
                      {etapaActual === 'CONCLUIDO' ? 'Concluido' : proceso.activo ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Etapa</p>
                    <p className="font-semibold text-text">{getEtapaLabel(etapaActual)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${proceso.por_cgr ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {proceso.por_cgr ? (
                      <CheckCircle className="text-red-600" size={24} />
                    ) : (
                      <XCircle className="text-gray-500" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Por CGR</p>
                    <p className="font-semibold text-text">
                      {proceso.por_cgr ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl p-8 border border-primary-100 shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-text">Información del Proceso</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Resolución
                  </label>
                  <p className="text-text font-medium">{proceso.numero_resolucion}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Resolución
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <p className="text-text">{formatearFecha(proceso.fecha_resolucion.toDate())}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Proceso
                  </label>
                  <p className="text-text">{proceso.tipo_proceso}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Actual
                  </label>
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <p className="text-text">{proceso.fiscal_actual.nombre}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Notificación (Fiscal Actual)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <p className="text-text">
                      {cicloActivo?.fecha_notificacion
                        ? formatearFecha(cicloActivo.fecha_notificacion.toDate())
                        : formatearFecha(proceso.fecha_notificacion.toDate())
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Por CGR
                  </label>
                  <p className="text-text">{proceso.por_cgr ? 'Sí' : 'No'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRH
                  </label>
                  <p className="text-text">{proceso.sirh ? 'Sí' : 'No'}</p>
                </div>

                {proceso.funcionario && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funcionario
                    </label>
                    <p className="text-text">{proceso.funcionario}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detalle
                </label>
                <p className="text-text bg-gray-50 p-4 rounded-lg">{proceso.detalle}</p>
              </div>

              {proceso.resolucion_final && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolución Final
                  </label>
                  <p className="text-text bg-gray-50 p-4 rounded-lg">{proceso.resolucion_final}</p>
                </div>
              )}

              {proceso.tipo_resultado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultado del Proceso
                  </label>
                  <p className="text-text bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium">
                      {proceso.tipo_resultado === 'medida_disciplinaria' && 'Medida Disciplinaria'}
                      {proceso.tipo_resultado === 'sobreseimiento' && 'Sobreseimiento'}
                      {proceso.tipo_resultado === 'absolucion' && 'Absolución'}
                    </span>
                    {proceso.detalle_resultado && (
                      <span className="block mt-2 text-gray-600">{proceso.detalle_resultado}</span>
                    )}
                  </p>
                </div>
              )}

              {proceso.memo_entrega_direccion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Memo Entrega Dirección
                  </label>
                  <p className="text-text bg-gray-50 p-4 rounded-lg">{proceso.memo_entrega_direccion}</p>
                </div>
              )}
            </div>

            {/* Revisión Jurídica */}
            {proceso.revision_juridica?.revision_realizada && (
              <div className="bg-white rounded-xl p-8 border border-indigo-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Scale className="text-indigo-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-text">Revisión Jurídica</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Revisión
                    </label>
                    <p className="text-text font-medium">
                      {proceso.revision_juridica.tipo_revision === 'reapertura' && 'Reapertura'}
                      {proceso.revision_juridica.tipo_revision === 'acoge_propuesta_fiscal' && 'Acoge Propuesta del Fiscal'}
                      {proceso.revision_juridica.tipo_revision === 'pendiente_de_revision' && 'Pendiente de Revisión'}
                    </p>
                  </div>

                  {proceso.revision_juridica.numero_memo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Memo
                      </label>
                      <p className="text-text font-medium">{proceso.revision_juridica.numero_memo}</p>
                    </div>
                  )}

                  {proceso.revision_juridica.fecha_revision && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Revisión
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="text-text">
                          {formatearFecha(proceso.revision_juridica.fecha_revision.toDate())}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estado de Ordinarios */}
            {cicloActivo && (cicloActivo.ordinario_20 || cicloActivo.ordinario_40 || cicloActivo.ordinario_60) && (
              <div className="bg-white rounded-xl p-8 border border-orange-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Send className="text-orange-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-text">Estado de Ordinarios</h3>
                </div>

                <div className="space-y-4">
                  {cicloActivo.ordinario_20 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Plazo</label>
                          <p className="text-sm font-medium text-orange-800">20 días</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">N° Ordinario</label>
                          <p className="text-sm font-medium text-text">{cicloActivo.ordinario_20.numero_ordinario}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Enviado</label>
                          <p className="text-sm font-medium text-green-600">Sí - {formatearFecha(cicloActivo.ordinario_20.fecha_ingreso.toDate())}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notificado</label>
                          <p className={`text-sm font-medium ${cicloActivo.ordinario_20.fecha_notificacion ? 'text-green-600' : 'text-yellow-600'}`}>
                            {cicloActivo.ordinario_20.fecha_notificacion
                              ? `Sí - ${formatearFecha(cicloActivo.ordinario_20.fecha_notificacion.toDate())}`
                              : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {cicloActivo.ordinario_40 && (
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Plazo</label>
                          <p className="text-sm font-medium text-amber-800">40 días</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">N° Ordinario</label>
                          <p className="text-sm font-medium text-text">{cicloActivo.ordinario_40.numero_ordinario}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Enviado</label>
                          <p className="text-sm font-medium text-green-600">Sí - {formatearFecha(cicloActivo.ordinario_40.fecha_ingreso.toDate())}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notificado</label>
                          <p className={`text-sm font-medium ${cicloActivo.ordinario_40.fecha_notificacion ? 'text-green-600' : 'text-yellow-600'}`}>
                            {cicloActivo.ordinario_40.fecha_notificacion
                              ? `Sí - ${formatearFecha(cicloActivo.ordinario_40.fecha_notificacion.toDate())}`
                              : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {cicloActivo.ordinario_60 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Plazo</label>
                          <p className="text-sm font-medium text-red-800">60 días</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">N° Ordinario</label>
                          <p className="text-sm font-medium text-text">{cicloActivo.ordinario_60.numero_ordinario}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Enviado</label>
                          <p className="text-sm font-medium text-green-600">Sí - {formatearFecha(cicloActivo.ordinario_60.fecha_ingreso.toDate())}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notificado</label>
                          <p className={`text-sm font-medium ${cicloActivo.ordinario_60.fecha_notificacion ? 'text-green-600' : 'text-yellow-600'}`}>
                            {cicloActivo.ordinario_60.fecha_notificacion
                              ? `Sí - ${formatearFecha(cicloActivo.ordinario_60.fecha_notificacion.toDate())}`
                              : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Historial de Fiscales */}
            <HistorialFiscal
              cicloActivo={cicloActivo}
              ciclosAnteriores={ciclosAnteriores}
              loading={loadingCiclos}
              onActualizarProrroga={actualizarProrroga}
              onEliminarProrroga={eliminarProrroga}
              onActualizarOrdinario={actualizarOrdinario}
              onEliminarOrdinario={eliminarOrdinario}
              editable={user?.role === 'admin'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 px-8 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};