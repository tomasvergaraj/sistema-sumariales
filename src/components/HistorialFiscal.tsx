import { useState } from 'react';
import { CicloFiscal } from '@/types';
import {
  formatearFecha,
  calcularEstadoPlazo,
  obtenerColorEstadoPlazo,
  obtenerTextoEstadoPlazo
} from '@/hooks/usePlazos';
import { diferenciaDiasHabiles } from '@/utils/diasHabiles';
import { User, Calendar, Clock, AlertCircle, FileText, Plus, Check, X, Trash2, Edit, Send } from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';

// Función para calcular si está por vencer (3 días hábiles o menos)
const estaPorVencer = (fechaTermino: Date): boolean => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const termino = new Date(fechaTermino);
  termino.setHours(0, 0, 0, 0);

  if (termino < hoy) return false; // Ya venció (el día del plazo aún cuenta como "por vencer")

  const diasHabilesRestantes = diferenciaDiasHabiles(hoy, termino);
  return diasHabilesRestantes <= 3;
};

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
  onActualizarOrdinario?: (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60',
    data: { numero_ordinario: string; fecha_ingreso: Date; fecha_notificacion?: Date | null }
  ) => Promise<void>;
  onEliminarOrdinario?: (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60'
  ) => Promise<void>;
  editable?: boolean;
}

interface PlazoItemProps {
  label: string;
  inicio: Date;
  termino: Date;
  estadoForzado?: 'vigente' | 'vencido' | 'por-vencer' | null;
}

const PlazoItem = ({ label, inicio, termino, estadoForzado }: PlazoItemProps) => {
  const estadoCalculado = calcularEstadoPlazo(termino);
  const estado = estadoForzado || estadoCalculado;

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
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${obtenerColorEstadoPlazo(estado)}`}>
          {obtenerTextoEstadoPlazo(estado)}
        </span>
      </div>
    </div>
  );
};

interface ProrrogaFormData {
  numero_resolucion: string;
  fecha_resolucion: string;
}

interface OrdinarioFormData {
  numero_ordinario: string;
  fecha_ingreso: string;
  fecha_notificacion: string;
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
  onActualizarOrdinario?: (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60',
    data: { numero_ordinario: string; fecha_ingreso: Date; fecha_notificacion?: Date | null }
  ) => Promise<void>;
  onEliminarOrdinario?: (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60'
  ) => Promise<void>;
  editable?: boolean;
}

const CicloFiscalCard = ({ ciclo, esActivo, onActualizarProrroga, onEliminarProrroga, onActualizarOrdinario, onEliminarOrdinario, editable = false }: CicloFiscalCardProps) => {
  const [editandoProrroga1, setEditandoProrroga1] = useState(false);
  const [editandoProrroga2, setEditandoProrroga2] = useState(false);
  const [editandoOrdinario20, setEditandoOrdinario20] = useState(false);
  const [editandoOrdinario40, setEditandoOrdinario40] = useState(false);
  const [editandoOrdinario60, setEditandoOrdinario60] = useState(false);
  const { confirm } = useNotificationContext();
  const [prorroga1Form, setProrroga1Form] = useState<ProrrogaFormData>({
    numero_resolucion: ciclo.prorroga_1?.numero_resolucion || '',
    fecha_resolucion: ciclo.prorroga_1?.fecha_resolucion?.toDate().toISOString().split('T')[0] || '',
  });
  const [prorroga2Form, setProrroga2Form] = useState<ProrrogaFormData>({
    numero_resolucion: ciclo.prorroga_2?.numero_resolucion || '',
    fecha_resolucion: ciclo.prorroga_2?.fecha_resolucion?.toDate().toISOString().split('T')[0] || '',
  });
  const [ordinario20Form, setOrdinario20Form] = useState<OrdinarioFormData>({
    numero_ordinario: ciclo.ordinario_20?.numero_ordinario || '',
    fecha_ingreso: ciclo.ordinario_20?.fecha_ingreso?.toDate().toISOString().split('T')[0] || '',
    fecha_notificacion: ciclo.ordinario_20?.fecha_notificacion?.toDate().toISOString().split('T')[0] || '',
  });
  const [ordinario40Form, setOrdinario40Form] = useState<OrdinarioFormData>({
    numero_ordinario: ciclo.ordinario_40?.numero_ordinario || '',
    fecha_ingreso: ciclo.ordinario_40?.fecha_ingreso?.toDate().toISOString().split('T')[0] || '',
    fecha_notificacion: ciclo.ordinario_40?.fecha_notificacion?.toDate().toISOString().split('T')[0] || '',
  });
  const [ordinario60Form, setOrdinario60Form] = useState<OrdinarioFormData>({
    numero_ordinario: ciclo.ordinario_60?.numero_ordinario || '',
    fecha_ingreso: ciclo.ordinario_60?.fecha_ingreso?.toDate().toISOString().split('T')[0] || '',
    fecha_notificacion: ciclo.ordinario_60?.fecha_notificacion?.toDate().toISOString().split('T')[0] || '',
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

  const handleGuardarOrdinario = async (tipo: 'ordinario_20' | 'ordinario_40' | 'ordinario_60') => {
    if (!ciclo.id || !onActualizarOrdinario) return;

    const formData = tipo === 'ordinario_20' ? ordinario20Form : tipo === 'ordinario_40' ? ordinario40Form : ordinario60Form;
    if (!formData.numero_ordinario || !formData.fecha_ingreso) return;

    setGuardando(true);
    try {
      await onActualizarOrdinario(ciclo.id, tipo, {
        numero_ordinario: formData.numero_ordinario,
        fecha_ingreso: new Date(formData.fecha_ingreso),
        fecha_notificacion: formData.fecha_notificacion ? new Date(formData.fecha_notificacion) : null,
      });
      if (tipo === 'ordinario_20') setEditandoOrdinario20(false);
      else if (tipo === 'ordinario_40') setEditandoOrdinario40(false);
      else setEditandoOrdinario60(false);
    } catch (error) {
      console.error('Error al guardar ordinario:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarOrdinario = async (tipo: 'ordinario_20' | 'ordinario_40' | 'ordinario_60') => {
    if (!ciclo.id || !onEliminarOrdinario) return;

    const tipoTexto = tipo === 'ordinario_20' ? '20 días' : tipo === 'ordinario_40' ? '40 días' : '60 días';

    confirm({
      title: 'Eliminar Ordinario',
      message: `¿Estás seguro de que quieres eliminar el ordinario de ${tipoTexto}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (!ciclo.id || !onEliminarOrdinario) return;
          await onEliminarOrdinario(ciclo.id, tipo);
        } catch (error) {
          console.error('Error al eliminar ordinario:', error);
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
        {(() => {
          const plazo20Vencido = ciclo.plazos.plazo_20 && calcularEstadoPlazo(ciclo.plazos.plazo_20.termino.toDate()) === 'vencido';
          const plazo40Vencido = ciclo.plazos.plazo_40 && calcularEstadoPlazo(ciclo.plazos.plazo_40.termino.toDate()) === 'vencido';
          const tieneProrroga1 = !!ciclo.prorroga_1;
          const tieneProrroga2 = !!ciclo.prorroga_2;

          // Determinar cuál es el plazo activo
          let plazoActivo: '20' | '40' | '60' | null = null;
          if (esActivo) {
            if (!plazo20Vencido) {
              plazoActivo = '20';
            } else if (tieneProrroga1 && !plazo40Vencido) {
              plazoActivo = '40';
            } else if (tieneProrroga1 && tieneProrroga2 && ciclo.plazos.plazo_60) {
              plazoActivo = '60';
            }
          }

          // Calcular si los plazos están por vencer (3 días hábiles o menos)
          const plazo20PorVencer = ciclo.plazos.plazo_20 && estaPorVencer(ciclo.plazos.plazo_20.termino.toDate());
          const plazo40PorVencer = ciclo.plazos.plazo_40 && estaPorVencer(ciclo.plazos.plazo_40.termino.toDate());
          const plazo60PorVencer = ciclo.plazos.plazo_60 && estaPorVencer(ciclo.plazos.plazo_60.termino.toDate());

          // Función para determinar el estado del plazo
          const getEstadoPlazo = (
            esActivo: boolean,
            esPlazoActivo: boolean,
            estaVencido: boolean,
            estaPorVencer: boolean
          ): 'vigente' | 'vencido' | 'por-vencer' | null => {
            if (estaVencido) return 'vencido';
            if (esActivo && esPlazoActivo && estaPorVencer) return 'por-vencer';
            if (esActivo && esPlazoActivo) return 'vigente';
            return null;
          };

          return (
            <>
              {/* Plazo 20 días - siempre se muestra */}
              {ciclo.plazos.plazo_20 && (
                <PlazoItem
                  label="Plazo 20 días"
                  inicio={ciclo.plazos.plazo_20.inicio.toDate()}
                  termino={ciclo.plazos.plazo_20.termino.toDate()}
                  estadoForzado={getEstadoPlazo(esActivo, plazoActivo === '20', !!plazo20Vencido, !!plazo20PorVencer)}
                />
              )}
              {/* Plazo 40 días - solo se muestra si hay prórroga 1 */}
              {ciclo.plazos.plazo_40 && tieneProrroga1 && (
                <PlazoItem
                  label="Plazo 40 días"
                  inicio={ciclo.plazos.plazo_40.inicio.toDate()}
                  termino={ciclo.plazos.plazo_40.termino.toDate()}
                  estadoForzado={getEstadoPlazo(esActivo, plazoActivo === '40', !!plazo40Vencido, !!plazo40PorVencer)}
                />
              )}
              {/* Plazo 60 días - solo se muestra si hay prórroga 2 */}
              {ciclo.plazos.plazo_60 && tieneProrroga2 && (
                <PlazoItem
                  label="Plazo 60 días"
                  inicio={ciclo.plazos.plazo_60.inicio.toDate()}
                  termino={ciclo.plazos.plazo_60.termino.toDate()}
                  estadoForzado={getEstadoPlazo(esActivo, plazoActivo === '60', false, !!plazo60PorVencer)}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* Prórrogas */}
      {(() => {
        const plazo20Vencido = ciclo.plazos.plazo_20 && calcularEstadoPlazo(ciclo.plazos.plazo_20.termino.toDate()) === 'vencido';
        const tieneProrroga1 = !!ciclo.prorroga_1;
        const mostrarProrroga2 = plazo20Vencido && tieneProrroga1;

        return (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Prórrogas:</p>

            {/* Primera Prórroga (después de 20 días) - siempre se muestra */}
            <div className={`${mostrarProrroga2 ? 'mb-3' : ''} p-3 bg-blue-50 rounded-lg`}>
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

            {/* Segunda Prórroga (después de 40 días) - solo se muestra si plazo 20 venció y hay prórroga 1 */}
            {mostrarProrroga2 && (
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
            )}
          </div>
        );
      })()}

      {/* Ordinarios - se muestran cuando un plazo vence sin prórroga */}
      {(() => {
        const plazo20Vencido = ciclo.plazos.plazo_20 && calcularEstadoPlazo(ciclo.plazos.plazo_20.termino.toDate()) === 'vencido';
        const plazo40Vencido = ciclo.plazos.plazo_40 && calcularEstadoPlazo(ciclo.plazos.plazo_40.termino.toDate()) === 'vencido';
        const plazo60Vencido = ciclo.plazos.plazo_60 && calcularEstadoPlazo(ciclo.plazos.plazo_60.termino.toDate()) === 'vencido';
        const tieneProrroga1 = !!ciclo.prorroga_1;
        const tieneProrroga2 = !!ciclo.prorroga_2;

        // Mostrar ordinario_20 cuando plazo 20 venció y NO hay prórroga 1
        const mostrarOrdinario20 = plazo20Vencido && !tieneProrroga1;
        // Mostrar ordinario_40 cuando plazo 40 venció y NO hay prórroga 2 (pero sí hay prórroga 1)
        const mostrarOrdinario40 = plazo40Vencido && tieneProrroga1 && !tieneProrroga2;
        // Mostrar ordinario_60 cuando plazo 60 venció (tiene ambas prórrogas)
        const mostrarOrdinario60 = plazo60Vencido && tieneProrroga1 && tieneProrroga2;

        if (!mostrarOrdinario20 && !mostrarOrdinario40 && !mostrarOrdinario60) return null;

        return (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Envío de Ordinarios:</p>

            {/* Ordinario 20 días */}
            {mostrarOrdinario20 && (
              <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Send size={14} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Ordinario Plazo 20 días</span>
                  </div>
                  {editable && !editandoOrdinario20 && !ciclo.ordinario_20 && (
                    <button
                      onClick={() => setEditandoOrdinario20(true)}
                      className="text-orange-600 hover:text-orange-800 text-xs flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Agregar</span>
                    </button>
                  )}
                </div>

                {ciclo.ordinario_20 && !editandoOrdinario20 ? (
                  <div className="text-sm text-orange-700">
                    <p>N° Ordinario: <span className="font-medium">{ciclo.ordinario_20.numero_ordinario}</span></p>
                    <p>Fecha Ingreso: <span className="font-medium">{formatearFecha(ciclo.ordinario_20.fecha_ingreso.toDate())}</span></p>
                    <p>Notificación: <span className="font-medium">{ciclo.ordinario_20.fecha_notificacion ? formatearFecha(ciclo.ordinario_20.fecha_notificacion.toDate()) : <span className="text-yellow-600">Pendiente</span>}</span></p>
                    {editable && (
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => setEditandoOrdinario20(true)}
                          className="text-xs text-orange-600 hover:underline flex items-center space-x-1"
                        >
                          <Edit size={10} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleEliminarOrdinario('ordinario_20')}
                          className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Trash2 size={10} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : editandoOrdinario20 ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={ordinario20Form.numero_ordinario}
                      onChange={(e) => setOrdinario20Form({ ...ordinario20Form, numero_ordinario: e.target.value })}
                      placeholder="N° Ordinario"
                      className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Ingreso</label>
                      <input
                        type="date"
                        value={ordinario20Form.fecha_ingreso}
                        onChange={(e) => setOrdinario20Form({ ...ordinario20Form, fecha_ingreso: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Notificación</label>
                      <input
                        type="date"
                        value={ordinario20Form.fecha_notificacion}
                        onChange={(e) => setOrdinario20Form({ ...ordinario20Form, fecha_notificacion: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGuardarOrdinario('ordinario_20')}
                        disabled={guardando}
                        className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        <Check size={12} />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => setEditandoOrdinario20(false)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        <X size={12} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-orange-600 italic">Sin ordinario registrado</p>
                )}
              </div>
            )}

            {/* Ordinario 40 días */}
            {mostrarOrdinario40 && (
              <div className="mb-3 p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Send size={14} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Ordinario Plazo 40 días</span>
                  </div>
                  {editable && !editandoOrdinario40 && !ciclo.ordinario_40 && (
                    <button
                      onClick={() => setEditandoOrdinario40(true)}
                      className="text-amber-600 hover:text-amber-800 text-xs flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Agregar</span>
                    </button>
                  )}
                </div>

                {ciclo.ordinario_40 && !editandoOrdinario40 ? (
                  <div className="text-sm text-amber-700">
                    <p>N° Ordinario: <span className="font-medium">{ciclo.ordinario_40.numero_ordinario}</span></p>
                    <p>Fecha Ingreso: <span className="font-medium">{formatearFecha(ciclo.ordinario_40.fecha_ingreso.toDate())}</span></p>
                    <p>Notificación: <span className="font-medium">{ciclo.ordinario_40.fecha_notificacion ? formatearFecha(ciclo.ordinario_40.fecha_notificacion.toDate()) : <span className="text-yellow-600">Pendiente</span>}</span></p>
                    {editable && (
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => setEditandoOrdinario40(true)}
                          className="text-xs text-amber-600 hover:underline flex items-center space-x-1"
                        >
                          <Edit size={10} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleEliminarOrdinario('ordinario_40')}
                          className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Trash2 size={10} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : editandoOrdinario40 ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={ordinario40Form.numero_ordinario}
                      onChange={(e) => setOrdinario40Form({ ...ordinario40Form, numero_ordinario: e.target.value })}
                      placeholder="N° Ordinario"
                      className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none"
                    />
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Ingreso</label>
                      <input
                        type="date"
                        value={ordinario40Form.fecha_ingreso}
                        onChange={(e) => setOrdinario40Form({ ...ordinario40Form, fecha_ingreso: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Notificación</label>
                      <input
                        type="date"
                        value={ordinario40Form.fecha_notificacion}
                        onChange={(e) => setOrdinario40Form({ ...ordinario40Form, fecha_notificacion: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGuardarOrdinario('ordinario_40')}
                        disabled={guardando}
                        className="flex items-center space-x-1 px-3 py-1 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Check size={12} />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => setEditandoOrdinario40(false)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        <X size={12} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 italic">Sin ordinario registrado</p>
                )}
              </div>
            )}

            {/* Ordinario 60 días */}
            {mostrarOrdinario60 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Send size={14} className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">Ordinario Plazo 60 días</span>
                  </div>
                  {editable && !editandoOrdinario60 && !ciclo.ordinario_60 && (
                    <button
                      onClick={() => setEditandoOrdinario60(true)}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Agregar</span>
                    </button>
                  )}
                </div>

                {ciclo.ordinario_60 && !editandoOrdinario60 ? (
                  <div className="text-sm text-red-700">
                    <p>N° Ordinario: <span className="font-medium">{ciclo.ordinario_60.numero_ordinario}</span></p>
                    <p>Fecha Ingreso: <span className="font-medium">{formatearFecha(ciclo.ordinario_60.fecha_ingreso.toDate())}</span></p>
                    <p>Notificación: <span className="font-medium">{ciclo.ordinario_60.fecha_notificacion ? formatearFecha(ciclo.ordinario_60.fecha_notificacion.toDate()) : <span className="text-yellow-600">Pendiente</span>}</span></p>
                    {editable && (
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => setEditandoOrdinario60(true)}
                          className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Edit size={10} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleEliminarOrdinario('ordinario_60')}
                          className="text-xs text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Trash2 size={10} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : editandoOrdinario60 ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={ordinario60Form.numero_ordinario}
                      onChange={(e) => setOrdinario60Form({ ...ordinario60Form, numero_ordinario: e.target.value })}
                      placeholder="N° Ordinario"
                      className="w-full px-3 py-1.5 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                    />
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Ingreso</label>
                      <input
                        type="date"
                        value={ordinario60Form.fecha_ingreso}
                        onChange={(e) => setOrdinario60Form({ ...ordinario60Form, fecha_ingreso: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Fecha de Notificación</label>
                      <input
                        type="date"
                        value={ordinario60Form.fecha_notificacion}
                        onChange={(e) => setOrdinario60Form({ ...ordinario60Form, fecha_notificacion: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGuardarOrdinario('ordinario_60')}
                        disabled={guardando}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Check size={12} />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => setEditandoOrdinario60(false)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                      >
                        <X size={12} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 italic">Sin ordinario registrado</p>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export const HistorialFiscal = ({ cicloActivo, ciclosAnteriores, loading, onActualizarProrroga, onEliminarProrroga, onActualizarOrdinario, onEliminarOrdinario, editable = false }: HistorialFiscalProps) => {
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
          onActualizarOrdinario={onActualizarOrdinario}
          onEliminarOrdinario={onEliminarOrdinario}
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
              onActualizarOrdinario={onActualizarOrdinario}
              onEliminarOrdinario={onEliminarOrdinario}
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
