import { useState } from 'react';
import { CicloFiscal } from '@/types';
import {
  formatearFecha,
  calcularEstadoPlazo,
  obtenerColorEstadoPlazo,
  obtenerTextoEstadoPlazo
} from '@/hooks/usePlazos';
import { User, Calendar, Clock, AlertCircle, FileText, Plus, Check, X, Trash2, Edit } from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';

interface HistorialFiscalProps {
  cicloActivo: CicloFiscal | undefined;
  ciclosAnteriores: CicloFiscal[];
  loading: boolean;
  onActualizarProrroga?: (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2',
    data: { numero_resolucion: string; fecha_resolucion: Date }
  ) => Promise<void>;
  onEliminarProrroga?: (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2'
  ) => Promise<void>;
  editable?: boolean;
}

interface PlazoItemProps {
  label: string;
  inicio: Date;
  termino: Date;
  mostrarEstado?: boolean;
}

const PlazoItem = ({ label, inicio, termino, mostrarEstado = true }: PlazoItemProps) => {
  const estado = calcularEstadoPlazo(termino);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-2">
        <Clock size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          {formatearFecha(inicio)} - {formatearFecha(termino)}
        </span>
        {mostrarEstado && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${obtenerColorEstadoPlazo(estado)}`}>
            {obtenerTextoEstadoPlazo(estado)}
          </span>
        )}
      </div>
    </div>
  );
};

interface ProrrogaFormData {
  numero_resolucion: string;
  fecha_resolucion: string;
}

interface CicloFiscalCardProps {
  ciclo: CicloFiscal;
  esActivo: boolean;
  onActualizarProrroga?: (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2',
    data: { numero_resolucion: string; fecha_resolucion: Date }
  ) => Promise<void>;
  onEliminarProrroga?: (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2'
  ) => Promise<void>;
  editable?: boolean;
}

const CicloFiscalCard = ({ ciclo, esActivo, onActualizarProrroga, onEliminarProrroga, editable = false }: CicloFiscalCardProps) => {
  const [editandoProrroga1, setEditandoProrroga1] = useState(false);
  const [editandoProrroga2, setEditandoProrroga2] = useState(false);
  const { confirm } = useNotificationContext();
  const [prorroga1Form, setProrroga1Form] = useState<ProrrogaFormData>({
    numero_resolucion: ciclo.prorroga_1?.numero_resolucion || '',
    fecha_resolucion: ciclo.prorroga_1?.fecha_resolucion?.toDate().toISOString().split('T')[0] || '',
  });
  const [prorroga2Form, setProrroga2Form] = useState<ProrrogaFormData>({
    numero_resolucion: ciclo.prorroga_2?.numero_resolucion || '',
    fecha_resolucion: ciclo.prorroga_2?.fecha_resolucion?.toDate().toISOString().split('T')[0] || '',
  });
  const [guardando, setGuardando] = useState(false);

  const handleGuardarProrroga = async (tipo: 'prorroga_1' | 'prorroga_2') => {
    if (!ciclo.id || !onActualizarProrroga) return;

    const formData = tipo === 'prorroga_1' ? prorroga1Form : prorroga2Form;
    if (!formData.numero_resolucion || !formData.fecha_resolucion) return;

    setGuardando(true);
    try {
      await onActualizarProrroga(ciclo.id, tipo, {
        numero_resolucion: formData.numero_resolucion,
        fecha_resolucion: new Date(formData.fecha_resolucion),
      });
      if (tipo === 'prorroga_1') setEditandoProrroga1(false);
      else setEditandoProrroga2(false);
    } catch (error) {
      console.error('Error al guardar prórroga:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProrroga = async (tipo: 'prorroga_1' | 'prorroga_2') => {
    if (!ciclo.id || !onEliminarProrroga) {
      console.error('Cannot delete prorroga:', { cicloId: ciclo.id, hasOnEliminar: !!onEliminarProrroga });
      return;
    }

    const tipoTexto = tipo === 'prorroga_1' ? 'primera' : 'segunda';

    confirm({
      title: 'Eliminar Prórroga',
      message: `¿Estás seguro de que quieres eliminar la ${tipoTexto} prórroga? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (!ciclo.id || !onEliminarProrroga) return; // Verificación adicional
          await onEliminarProrroga(ciclo.id, tipo);
        } catch (error) {
          console.error('Error al eliminar prórroga:', error);
        }
      }
    });
  };

  return (
    <div className={`bg-white rounded-xl p-6 border shadow-sm ${esActivo ? 'border-primary-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${esActivo ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <User className={esActivo ? 'text-primary-600' : 'text-gray-500'} size={20} />
          </div>
          <div>
            <p className="font-semibold text-text">{ciclo.fiscal}</p>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Calendar size={12} />
              <span>Asignado: {formatearFecha(ciclo.fecha_inicio.toDate())}</span>
            </div>
            {ciclo.fecha_notificacion && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock size={12} />
                <span>Notificado: {formatearFecha(ciclo.fecha_notificacion.toDate())}</span>
              </div>
            )}
          </div>
        </div>
        {esActivo && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Fiscal Actual
          </span>
        )}
      </div>

      {ciclo.motivo_cambio && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-start space-x-2">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-700">Motivo del cambio</p>
            <p className="text-sm text-amber-800">{ciclo.motivo_cambio}</p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700 mb-2">Plazos asignados:</p>
        {ciclo.plazos.plazo_20 && (
          <PlazoItem
            label="Plazo 20 días"
            inicio={ciclo.plazos.plazo_20.inicio.toDate()}
            termino={ciclo.plazos.plazo_20.termino.toDate()}
            mostrarEstado={esActivo}
          />
        )}
        {ciclo.plazos.plazo_40 && (
          <PlazoItem
            label="Plazo 40 días"
            inicio={ciclo.plazos.plazo_40.inicio.toDate()}
            termino={ciclo.plazos.plazo_40.termino.toDate()}
            mostrarEstado={esActivo}
          />
        )}
        {ciclo.plazos.plazo_60 && (
          <PlazoItem
            label="Plazo 60 días"
            inicio={ciclo.plazos.plazo_60.inicio.toDate()}
            termino={ciclo.plazos.plazo_60.termino.toDate()}
            mostrarEstado={esActivo}
          />
        )}
      </div>

      {/* Prórrogas */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">Prórrogas:</p>

        {/* Primera Prórroga (después de 20 días) */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FileText size={14} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">1° Prórroga (20 a 40 días)</span>
            </div>
            {editable && !editandoProrroga1 && !ciclo.prorroga_1 && (
              <button
                onClick={() => setEditandoProrroga1(true)}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            )}
          </div>

          {ciclo.prorroga_1 && !editandoProrroga1 ? (
            <div className="text-sm text-blue-700">
              <p>Resolución: <span className="font-medium">{ciclo.prorroga_1.numero_resolucion}</span></p>
              <p>Fecha: <span className="font-medium">{formatearFecha(ciclo.prorroga_1.fecha_resolucion.toDate())}</span></p>
              {editable && (
                <div className="flex space-x-2 mt-1">
                  <button
                    onClick={() => setEditandoProrroga1(true)}
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <Edit size={10} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleEliminarProrroga('prorroga_1')}
                    className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                  >
                    <Trash2 size={10} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          ) : editandoProrroga1 ? (
            <div className="space-y-2">
              <input
                type="text"
                value={prorroga1Form.numero_resolucion}
                onChange={(e) => setProrroga1Form({ ...prorroga1Form, numero_resolucion: e.target.value })}
                placeholder="N° Resolución"
                className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <input
                type="date"
                value={prorroga1Form.fecha_resolucion}
                onChange={(e) => setProrroga1Form({ ...prorroga1Form, fecha_resolucion: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGuardarProrroga('prorroga_1')}
                  disabled={guardando}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check size={12} />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => setEditandoProrroga1(false)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                >
                  <X size={12} />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-600 italic">Sin prórroga registrada</p>
          )}
        </div>

        {/* Segunda Prórroga (después de 40 días) */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FileText size={14} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">2° Prórroga (40 a 60 días)</span>
            </div>
            {editable && !editandoProrroga2 && !ciclo.prorroga_2 && (
              <button
                onClick={() => setEditandoProrroga2(true)}
                className="text-purple-600 hover:text-purple-800 text-xs flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            )}
          </div>

          {ciclo.prorroga_2 && !editandoProrroga2 ? (
            <div className="text-sm text-purple-700">
              <p>Resolución: <span className="font-medium">{ciclo.prorroga_2.numero_resolucion}</span></p>
              <p>Fecha: <span className="font-medium">{formatearFecha(ciclo.prorroga_2.fecha_resolucion.toDate())}</span></p>
              {editable && (
                <div className="flex space-x-2 mt-1">
                  <button
                    onClick={() => setEditandoProrroga2(true)}
                    className="text-xs text-purple-600 hover:underline flex items-center space-x-1"
                  >
                    <Edit size={10} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleEliminarProrroga('prorroga_2')}
                    className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                  >
                    <Trash2 size={10} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          ) : editandoProrroga2 ? (
            <div className="space-y-2">
              <input
                type="text"
                value={prorroga2Form.numero_resolucion}
                onChange={(e) => setProrroga2Form({ ...prorroga2Form, numero_resolucion: e.target.value })}
                placeholder="N° Resolución"
                className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
              />
              <input
                type="date"
                value={prorroga2Form.fecha_resolucion}
                onChange={(e) => setProrroga2Form({ ...prorroga2Form, fecha_resolucion: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGuardarProrroga('prorroga_2')}
                  disabled={guardando}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Check size={12} />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => setEditandoProrroga2(false)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                >
                  <X size={12} />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-purple-600 italic">Sin prórroga registrada</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const HistorialFiscal = ({ cicloActivo, ciclosAnteriores, loading, onActualizarProrroga, onEliminarProrroga, editable = false }: HistorialFiscalProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-primary-100 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Historial de Fiscales y Plazos</h3>

      {cicloActivo && (
        <CicloFiscalCard
          ciclo={cicloActivo}
          esActivo={true}
          onActualizarProrroga={onActualizarProrroga}
          onEliminarProrroga={onEliminarProrroga}
          editable={editable}
        />
      )}

      {ciclosAnteriores.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Fiscales Anteriores ({ciclosAnteriores.length})
          </h4>
          {ciclosAnteriores.map((ciclo) => (
            <CicloFiscalCard
              key={ciclo.id}
              ciclo={ciclo}
              esActivo={false}
              onActualizarProrroga={onActualizarProrroga}
              onEliminarProrroga={onEliminarProrroga}
              editable={editable}
            />
          ))}
        </div>
      )}

      {!cicloActivo && ciclosAnteriores.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">No hay historial de fiscales registrado</p>
        </div>
      )}
    </div>
  );
};
