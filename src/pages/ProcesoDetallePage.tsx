import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useProcesos } from '@/hooks/useProcesos';
import { useCiclosFiscal } from '@/hooks/useCiclosFiscal';
import { useAuthStore } from '@/context/authStore';
import { formatearFecha } from '@/hooks/usePlazos';
import { ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Award, Scale } from 'lucide-react';
import { ProcesoSumarial } from '@/types';
import { HistorialFiscal } from '@/components/HistorialFiscal';

export const ProcesoDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { procesos, forceRefresh } = useProcesos();
  const { user } = useAuthStore();
  const [proceso, setProceso] = useState<ProcesoSumarial | null>(null);
  const { cicloActivo, ciclosAnteriores, loading: loadingCiclos, actualizarProrroga, eliminarProrroga } = useCiclosFiscal(id, forceRefresh);

  useEffect(() => {
    if (id && procesos.length > 0) {
      const foundProceso = procesos.find(p => p.id === id);
      setProceso(foundProceso || null);
    }
  }, [id, procesos]);

  if (!proceso) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
        </div>
      </MainLayout>
    );
  }

  // const getEtapaColor = (etapa: string) => {
  //   switch (etapa) {
  //     case 'INDAGATORIA':
  //       return 'bg-blue-100 text-blue-700';
  //     case 'INDAGATORIA_VIGENTE':
  //       return 'bg-purple-100 text-purple-700';
  //     case 'ACUSATORIO':
  //       return 'bg-orange-100 text-orange-700';
  //     case 'CONCLUIDO':
  //       return 'bg-green-100 text-green-700';
  //     default:
  //       return 'bg-gray-100 text-gray-700';
  //   }
  // };

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
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/procesos')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-text">Proceso Sumarial</h2>
            <p className="text-gray-600">Resolución {proceso.numero_resolucion}</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                proceso.etapa === 'CONCLUIDO'
                  ? 'bg-purple-100'
                  : proceso.activo
                    ? 'bg-green-100'
                    : 'bg-gray-100'
              }`}>
                {proceso.etapa === 'CONCLUIDO' ? (
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
                  {proceso.etapa === 'CONCLUIDO' ? 'Concluido' : proceso.activo ? 'Activo' : 'Inactivo'}
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
                <p className="font-semibold text-text">{getEtapaLabel(proceso.etapa)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${proceso.envio_ordinario ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {proceso.envio_ordinario ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <XCircle className="text-yellow-600" size={24} />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Envío Ordinario</p>
                <p className="font-semibold text-text">
                  {proceso.envio_ordinario ? 'Enviado' : 'Pendiente'}
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

        {/* Historial de Fiscales */}
        <HistorialFiscal
          key={id} // Force re-render when process changes
          cicloActivo={cicloActivo}
          ciclosAnteriores={ciclosAnteriores}
          loading={loadingCiclos}
          onActualizarProrroga={actualizarProrroga}
          onEliminarProrroga={eliminarProrroga}
          editable={user?.role === 'admin'}
        />
      </div>
    </MainLayout>
  );
};