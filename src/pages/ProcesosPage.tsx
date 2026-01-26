import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { useProcesos } from '@/hooks/useProcesos';
import { useAuthStore } from '@/context/authStore';
import { formatearFecha } from '@/hooks/usePlazos';
import { Plus, Search, Filter, Eye, Edit, Scale, CheckCircle, Clock } from 'lucide-react';
import { ModalRevisionJuridica } from '@/components/ModalRevisionJuridica';
import { NuevoProcesoModal } from '@/components/NuevoProcesoModal';
import { ProcesoEditarModal } from '@/components/ProcesoEditarModal';
import { ProcesoDetalleModal } from '@/components/ProcesoDetalleModal';
import { ProcesoSumarial, RevisionJuridica } from '@/types';
import { Timestamp } from 'firebase/firestore';


export const ProcesosPage = () => {
  const { procesos, loading, actualizarProceso } = useProcesos();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtapa, setFilterEtapa] = useState<string>('all');
  const [filterActivo, setFilterActivo] = useState<string>('all');
  const [modalJuridicaOpen, setModalJuridicaOpen] = useState(false);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<ProcesoSumarial | null>(null);
  const [nuevoProcesoModalOpen, setNuevoProcesoModalOpen] = useState(false);
  const [editarProcesoModalOpen, setEditarProcesoModalOpen] = useState(false);
  const [detalleProcesoModalOpen, setDetalleProcesoModalOpen] = useState(false);
  const [procesoIdSeleccionado, setProcesoIdSeleccionado] = useState<string>('');

  // Abrir modal desde query params (para notificaciones)
  useEffect(() => {
    const verProcesoId = searchParams.get('verProceso');
    if (verProcesoId && procesos.length > 0) {
      setProcesoIdSeleccionado(verProcesoId);
      setDetalleProcesoModalOpen(true);
      // Limpiar el query param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, procesos, setSearchParams]);

  const procesosFiltrados = useMemo(() => {
    return procesos.filter((proceso) => {
      const matchSearch =
        searchTerm === '' ||
        proceso.numero_resolucion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proceso.fiscal_actual.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proceso.detalle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEtapa = filterEtapa === 'all' || proceso.etapa === filterEtapa;
      const matchActivo =
        filterActivo === 'all' ||
        (filterActivo === 'activo' && proceso.activo) ||
        (filterActivo === 'inactivo' && !proceso.activo);

      return matchSearch && matchEtapa && matchActivo;
    });
  }, [procesos, searchTerm, filterEtapa, filterActivo]);

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'INDAGATORIA_VIGENTE':
        return 'bg-green-100 text-green-700';
      case 'INDAGATORIA_FUERA_PLAZO':
        return 'bg-red-100 text-red-700';
      case 'CONCLUIDO':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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

  const handleGuardarRevisionJuridica = async (data: RevisionJuridica) => {
    if (procesoSeleccionado?.id) {
      await actualizarProceso(procesoSeleccionado.id, {
        revision_juridica: {
          ...data,
          fecha_revision: data.revision_realizada ? Timestamp.now() : null,
        },
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text mb-2">Procesos Sumariales</h2>
            <p className="text-gray-600">Gestión y seguimiento de procesos</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setNuevoProcesoModalOpen(true)}
              className="flex items-center space-x-2 bg-primary-200 hover:bg-primary-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Nuevo Proceso</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Search size={16} className="inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° Resolución, fiscal, detalle..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Filter size={16} className="inline mr-1" />
                Etapa
              </label>
              <select
                value={filterEtapa}
                onChange={(e) => setFilterEtapa(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
              >
                <option value="all">Todas</option>
                <option value="INDAGATORIA_VIGENTE">Indagatoria Vigente</option>
                <option value="INDAGATORIA_FUERA_PLAZO">Indagatoria Fuera de Plazo</option>
                <option value="CONCLUIDO">Concluido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Filter size={16} className="inline mr-1" />
                Estado
              </label>
              <select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
              >
                <option value="all">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-primary-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    N° Resolución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fecha Resolución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fiscal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Etapa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Revisión Jurídica
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Envío Ordinario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procesosFiltrados.map((proceso) => (
                  <tr key={proceso.id} className="hover:bg-primary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                      {proceso.numero_resolucion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(proceso.fecha_resolucion.toDate())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {proceso.fiscal_actual.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getEtapaColor(
                          proceso.etapa
                        )}`}
                      >
                        {getEtapaLabel(proceso.etapa)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          proceso.etapa === 'CONCLUIDO'
                            ? 'bg-purple-100 text-purple-700'
                            : proceso.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proceso.etapa === 'CONCLUIDO' ? 'Concluido' : proceso.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {proceso.revision_juridica?.revision_realizada ? (
                        proceso.revision_juridica.tipo_revision === 'pendiente_de_revision' ? (
                          <Clock className="text-yellow-600" size={20} />
                        ) : (
                          <CheckCircle className="text-green-600" size={20} />
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={proceso.envio_ordinario}
                          onChange={async () => {
                            if (proceso.id) {
                              await actualizarProceso(proceso.id, { envio_ordinario: !proceso.envio_ordinario });
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (proceso.id) {
                              setProcesoIdSeleccionado(proceso.id);
                              setDetalleProcesoModalOpen(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (proceso.id) {
                                setProcesoIdSeleccionado(proceso.id);
                                setEditarProcesoModalOpen(true);
                              }
                            }}
                            className="text-primary-300 hover:text-primary-400 transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {user?.role === 'juridica' && (
                          <button
                            onClick={() => {
                              setProcesoSeleccionado(proceso);
                              setModalJuridicaOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Revisión Jurídica"
                          >
                            <Scale size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {procesosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron procesos</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg p-4 border border-primary-100">
          <p className="text-sm text-gray-600">
            Mostrando {procesosFiltrados.length} de {procesos.length} procesos
          </p>
        </div>
      </div>

      {/* Modal Revisión Jurídica */}
      {procesoSeleccionado && (
        <ModalRevisionJuridica
          isOpen={modalJuridicaOpen}
          onClose={() => {
            setModalJuridicaOpen(false);
            setProcesoSeleccionado(null);
          }}
          proceso={procesoSeleccionado}
          onGuardar={handleGuardarRevisionJuridica}
        />
      )}

      {/* Modal Nuevo Proceso */}
      <NuevoProcesoModal
        isOpen={nuevoProcesoModalOpen}
        onClose={() => setNuevoProcesoModalOpen(false)}
        onSuccess={() => {
          // La lista se actualizará automáticamente por el hook useProcesos
        }}
      />

      {/* Modal Editar Proceso */}
      <ProcesoEditarModal
        isOpen={editarProcesoModalOpen}
        onClose={() => setEditarProcesoModalOpen(false)}
        onSuccess={() => {
          // La lista se actualizará automáticamente por el hook useProcesos
        }}
        procesoId={procesoIdSeleccionado}
      />

      {/* Modal Detalle Proceso */}
      <ProcesoDetalleModal
        isOpen={detalleProcesoModalOpen}
        onClose={() => setDetalleProcesoModalOpen(false)}
        procesoId={procesoIdSeleccionado}
      />
    </MainLayout>
  );
};
