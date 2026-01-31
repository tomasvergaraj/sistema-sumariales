import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcesos } from '@/hooks/useProcesos';
import { useCiclosFiscal } from '@/hooks/useCiclosFiscal';
import { Timestamp } from 'firebase/firestore';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { X, Save, UserPlus } from 'lucide-react';
import { ProcesoSumarial, EtapaProceso, CicloFiscal } from '@/types';
import { useNotificationContext } from '@/context/NotificationContext';
import { addDiasHabiles } from '@/utils/diasHabiles';

const editarProcesoSchema = z.object({
  sirh: z.boolean(),
  tipo_proceso: z.string().min(1, 'Campo requerido'),
  numero_resolucion: z.string().min(1, 'Campo requerido'),
  fecha_resolucion: z.string().min(1, 'Campo requerido'),
  por_cgr: z.boolean(),
  detalle: z.string().min(1, 'Campo requerido'),

  fecha_notificacion: z.string().min(1, 'Campo requerido'),
  fiscal_nombre: z.string().min(1, 'Campo requerido'),
  motivo_cambio_fiscal: z.string().optional(),
  fecha_asignacion_fiscal: z.string().optional(),
  fecha_notificacion_fiscal: z.string().optional(),
  activo: z.boolean(),
  envio_ordinario: z.boolean(),
  resolucion_final: z.string().optional(),
  tipo_resultado: z.enum(['medida_disciplinaria', 'sobreseimiento', 'absolucion', '']).optional(),
  detalle_resultado: z.string().optional(),
  funcionario: z.string().optional(),
  enviado_cgr: z.boolean(),
  memo_entrega_direccion: z.string().optional(),
});

type EditarProcesoFormData = z.infer<typeof editarProcesoSchema>;

interface ProcesoEditarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  procesoId: string;
}

export const ProcesoEditarModal = ({ isOpen, onClose, onSuccess, procesoId }: ProcesoEditarModalProps) => {
  const { procesos, actualizarProceso, cambiarFiscal, determinarEtapaAutomatica } = useProcesos();
  const { cicloActivo } = useCiclosFiscal(procesoId);
  const { error: showError, warning: showWarning } = useNotificationContext();
  const [proceso, setProceso] = useState<ProcesoSumarial | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fiscalOriginal, setFiscalOriginal] = useState<string>('');
  const [fechaNotificacionOriginal, setFechaNotificacionOriginal] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditarProcesoFormData>({
    resolver: zodResolver(editarProcesoSchema),
  });

  const fiscalActualForm = watch('fiscal_nombre');
  const fiscalCambio = fiscalOriginal && fiscalActualForm && fiscalOriginal !== fiscalActualForm;
  const resolucionFinal = watch('resolucion_final');
  const tipoResultado = watch('tipo_resultado');
  const tieneResolucionFinal = !!resolucionFinal;

  useEffect(() => {
    if (procesoId && procesos.length > 0) {
      const foundProceso = procesos.find(p => p.id === procesoId);
      if (foundProceso) {
        setProceso(foundProceso);
        setFiscalOriginal(foundProceso.fiscal_actual.nombre);
        // Set form values
        setValue('sirh', foundProceso.sirh);
        setValue('tipo_proceso', foundProceso.tipo_proceso);
        setValue('numero_resolucion', foundProceso.numero_resolucion);
        setValue('fecha_resolucion', foundProceso.fecha_resolucion.toDate().toISOString().split('T')[0]);
        setValue('por_cgr', foundProceso.por_cgr);
        setValue('detalle', foundProceso.detalle);
        // Usar fecha de notificación del ciclo activo (fiscal actual) si existe
        const fechaNotifCiclo = cicloActivo?.fecha_notificacion?.toDate().toISOString().split('T')[0];
        const fechaNotif = fechaNotifCiclo || foundProceso.fecha_notificacion.toDate().toISOString().split('T')[0];
        setValue('fecha_notificacion', fechaNotif);
        setFechaNotificacionOriginal(fechaNotif);
        setValue('fiscal_nombre', foundProceso.fiscal_actual.nombre);
        setValue('fecha_asignacion_fiscal', new Date().toISOString().split('T')[0]);
        setValue('fecha_notificacion_fiscal', new Date().toISOString().split('T')[0]);
        setValue('activo', foundProceso.activo);
        setValue('envio_ordinario', foundProceso.envio_ordinario);
        setValue('resolucion_final', foundProceso.resolucion_final || '');
        setValue('tipo_resultado', foundProceso.tipo_resultado || '');
        setValue('detalle_resultado', foundProceso.detalle_resultado || '');
        setValue('funcionario', foundProceso.funcionario || '');
        setValue('enviado_cgr', foundProceso.enviado_cgr);
        setValue('memo_entrega_direccion', foundProceso.memo_entrega_direccion || '');
      }
    }
  }, [procesoId, procesos, setValue, cicloActivo]);

  const onSubmit = async (data: EditarProcesoFormData) => {
    if (!procesoId) return;

    try {
      setIsLoading(true);

      const hayCambioFiscal = fiscalOriginal !== data.fiscal_nombre;
      const hayCambioFechaNotificacion = fechaNotificacionOriginal !== data.fecha_notificacion;

      // Si hay cambio de fiscal, crear nuevo ciclo con sus plazos
      if (hayCambioFiscal) {
        if (!data.motivo_cambio_fiscal || !data.fecha_asignacion_fiscal || !data.fecha_notificacion_fiscal) {
          showWarning('Debe ingresar el motivo, fecha de asignación y fecha de notificación del nuevo fiscal');
          setIsLoading(false);
          return;
        }

        await cambiarFiscal(
          procesoId,
          data.fiscal_nombre,
          data.motivo_cambio_fiscal,
          new Date(data.fecha_asignacion_fiscal),
          new Date(data.fecha_notificacion_fiscal)
        );
      } else if (hayCambioFechaNotificacion && cicloActivo?.id) {
        // Si cambió la fecha de notificación del fiscal actual, actualizar el ciclo activo
        // Parsear fecha correctamente para evitar problemas de timezone
        const [year, month, day] = data.fecha_notificacion.split('-').map(Number);
        const nuevaFechaNotificacion = new Date(year, month - 1, day, 12, 0, 0);
        const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloActivo.id);
        await updateDoc(cicloRef, {
          fecha_notificacion: Timestamp.fromDate(nuevaFechaNotificacion),
          plazos: {
            plazo_20: {
              inicio: Timestamp.fromDate(nuevaFechaNotificacion),
              termino: Timestamp.fromDate(addDiasHabiles(nuevaFechaNotificacion, 20)),
            },
            plazo_40: {
              inicio: Timestamp.fromDate(addDiasHabiles(nuevaFechaNotificacion, 20)),
              termino: Timestamp.fromDate(addDiasHabiles(nuevaFechaNotificacion, 40)),
            },
            plazo_60: {
              inicio: Timestamp.fromDate(addDiasHabiles(nuevaFechaNotificacion, 40)),
              termino: Timestamp.fromDate(addDiasHabiles(nuevaFechaNotificacion, 60)),
            },
          },
        });
      }

      // Si hay resolución final, el proceso se marca como concluido e inactivo
      const tieneResolucionFinal = !!data.resolucion_final;
      const activoFinal = tieneResolucionFinal ? false : data.activo; // Respeta la selección del usuario si no hay resolución final

      // Calcular etapa automáticamente
      let etapaFinal: EtapaProceso;
      if (tieneResolucionFinal) {
        etapaFinal = 'CONCLUIDO';
      } else {
        // Obtener ciclo activo para calcular etapa
        const ciclosRef = collection(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal');
        const ciclosSnapshot = await getDocs(query(ciclosRef, where('activo', '==', true)));
        const cicloActivo = ciclosSnapshot.docs.length > 0 ? {
          id: ciclosSnapshot.docs[0].id,
          ...ciclosSnapshot.docs[0].data()
        } as CicloFiscal : undefined;

        // Crear objeto proceso temporal para calcular etapa
        const procesoTemporal: ProcesoSumarial = {
          ...proceso!,
          resolucion_final: null,
        };

        etapaFinal = determinarEtapaAutomatica(procesoTemporal, cicloActivo);
      }

      // Actualizar el resto de los campos del proceso
      await actualizarProceso(procesoId, {
        sirh: data.sirh,
        tipo_proceso: data.tipo_proceso,
        numero_resolucion: data.numero_resolucion,
        fecha_resolucion: Timestamp.fromDate(new Date(data.fecha_resolucion)),
        por_cgr: data.por_cgr,
        detalle: data.detalle,
        fecha_notificacion: Timestamp.fromDate(new Date(data.fecha_notificacion)),
        activo: activoFinal,
        envio_ordinario: data.envio_ordinario,
        resolucion_final: data.resolucion_final || null,
        tipo_resultado: data.tipo_resultado as 'medida_disciplinaria' | 'sobreseimiento' | 'absolucion' | null || null,
        detalle_resultado: data.detalle_resultado || null,
        funcionario: data.funcionario || null,
        enviado_cgr: data.enviado_cgr,
        memo_entrega_direccion: data.memo_entrega_direccion || null,
        etapa: etapaFinal,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar proceso:', error);
      showError('Error al actualizar el proceso');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!proceso) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-text">Editar Proceso Sumarial</h2>
            <p className="text-gray-600">Resolución {proceso.numero_resolucion}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Número de Resolución *
                </label>
                <input
                  {...register('numero_resolucion')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Ej: 001-2024"
                />
                {errors.numero_resolucion && (
                  <p className="mt-1 text-sm text-red-600">{errors.numero_resolucion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha de Resolución *
                </label>
                <input
                  {...register('fecha_resolucion')}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                />
                {errors.fecha_resolucion && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha_resolucion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tipo de Proceso *
                </label>
                <input
                  {...register('tipo_proceso')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Ej: Disciplinario"
                />
                {errors.tipo_proceso && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipo_proceso.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha de Notificación (Fiscal Actual) *
                </label>
                <input
                  {...register('fecha_notificacion')}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Los plazos se recalcularán desde esta fecha</p>
                {errors.fecha_notificacion && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha_notificacion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fiscal *
                </label>
                <input
                  {...register('fiscal_nombre')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Nombre del fiscal"
                />
                {errors.fiscal_nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.fiscal_nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Etapa Actual *
                </label>
                <input
                  type="text"
                  value={
                    proceso?.etapa === 'INDAGATORIA_VIGENTE' ? 'Indagatoria Vigente' :
                    proceso?.etapa === 'INDAGATORIA_FUERA_PLAZO' ? 'Indagatoria Fuera de Plazo' :
                    proceso?.etapa === 'CONCLUIDO' ? 'Concluido' : 'Indagatoria Vigente'
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  title="La etapa se calcula automáticamente basada en plazos y prórrogas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se calcula automáticamente según plazos y prórrogas
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">
                  Detalle *
                </label>
                <textarea
                  {...register('detalle')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Descripción del proceso"
                />
                {errors.detalle && (
                  <p className="mt-1 text-sm text-red-600">{errors.detalle.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cambio de Fiscal */}
          {fiscalCambio && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserPlus className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-amber-800">Cambio de Fiscal Detectado</h3>
              </div>
              <p className="text-sm text-amber-700 mb-4">
                Se ha detectado un cambio de fiscal. Se creará un nuevo ciclo con plazos de 20, 40 y 60 días desde la fecha de notificación al fiscal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Motivo del Cambio *
                  </label>
                  <input
                    {...register('motivo_cambio_fiscal')}
                    type="text"
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white"
                    placeholder="Ej: Renuncia, Recusación, Reasignación..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Fecha de Asignación *
                  </label>
                  <input
                    {...register('fecha_asignacion_fiscal')}
                    type="date"
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Fecha de Notificación *
                  </label>
                  <input
                    {...register('fecha_notificacion_fiscal')}
                    type="date"
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white"
                  />
                  <p className="text-xs text-amber-600 mt-1">Los plazos comienzan desde esta fecha</p>
                </div>
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Opciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300">
                <input
                  {...register('sirh')}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all peer-checked:bg-primary-300 peer-checked:border-primary-300 peer-focus:ring-2 peer-focus:ring-primary-200 peer-focus:ring-offset-2">
                  <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-text">SIRH</span>
                </div>
              </label>

              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300">
                <input
                  {...register('por_cgr')}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all peer-checked:bg-primary-300 peer-checked:border-primary-300 peer-focus:ring-2 peer-focus:ring-primary-200 peer-focus:ring-offset-2">
                  <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-text">Por CGR</span>
                </div>
              </label>

              {!tieneResolucionFinal && (
                <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all has-[:checked]:bg-green-50 has-[:checked]:border-green-400">
                  <input
                    {...register('activo')}
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all peer-checked:bg-green-500 peer-checked:border-green-500 peer-focus:ring-2 peer-focus:ring-green-200 peer-focus:ring-offset-2">
                    <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-text">Activo</span>
                  </div>
                </label>
              )}

              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                <input
                  {...register('envio_ordinario')}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-focus:ring-2 peer-focus:ring-blue-200 peer-focus:ring-offset-2">
                  <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-text">Envío Ordinario</span>
                </div>
              </label>

              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-all has-[:checked]:bg-amber-50 has-[:checked]:border-amber-400">
                <input
                  {...register('enviado_cgr')}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all peer-checked:bg-amber-500 peer-checked:border-amber-500 peer-focus:ring-2 peer-focus:ring-amber-200 peer-focus:ring-offset-2">
                  <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-text">Enviado a CGR</span>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Resolución Final
                </label>
                <input
                  {...register('resolucion_final')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Resolución final"
                />
                {tieneResolucionFinal && (
                  <p className="mt-1 text-xs text-amber-600">Al guardar, el proceso se marcará como Concluido</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Resultado del Proceso
                </label>
                <select
                  {...register('tipo_resultado')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                >
                  <option value="">Seleccionar resultado...</option>
                  <option value="medida_disciplinaria">Medida Disciplinaria</option>
                  <option value="sobreseimiento">Sobreseimiento</option>
                  <option value="absolucion">Absolución</option>
                </select>
              </div>

              {tipoResultado && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text mb-2">
                    Detalle del {tipoResultado === 'medida_disciplinaria' ? 'Medida Disciplinaria' : tipoResultado === 'sobreseimiento' ? 'Sobreseimiento' : 'Absolución'}
                  </label>
                  <textarea
                    {...register('detalle_resultado')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                    placeholder="Ingrese el detalle o razón..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Funcionario
                </label>
                <input
                  {...register('funcionario')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Nombre del funcionario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Memo Entrega Dirección
                </label>
                <input
                  {...register('memo_entrega_direccion')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Memo"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-200 hover:bg-primary-300 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              <span>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
