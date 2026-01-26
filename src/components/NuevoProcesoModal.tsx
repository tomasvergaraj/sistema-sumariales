import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcesos } from '@/hooks/useProcesos';
import { Timestamp } from 'firebase/firestore';
import { X, Save } from 'lucide-react';
import { useState } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';

const procesoSchema = z.object({
  sirh: z.boolean(),
  tipo_proceso: z.string().min(1, 'Campo requerido'),
  numero_resolucion: z.string().min(1, 'Campo requerido'),
  fecha_resolucion: z.string().min(1, 'Campo requerido'),
  por_cgr: z.boolean(),
  detalle: z.string().min(1, 'Campo requerido'),
  fecha_notificacion: z.string().min(1, 'Campo requerido'),
  fiscal_nombre: z.string().min(1, 'Campo requerido'),
});

type ProcesoFormData = z.infer<typeof procesoSchema>;

interface NuevoProcesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NuevoProcesoModal = ({ isOpen, onClose, onSuccess }: NuevoProcesoModalProps) => {
  const { crearProceso } = useProcesos();
  const { error: showError } = useNotificationContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcesoFormData>({
    resolver: zodResolver(procesoSchema),
    defaultValues: {
      sirh: false,
      por_cgr: false,
    },
  });

  const onSubmit = async (data: ProcesoFormData) => {
    try {
      setIsLoading(true);
      
      await crearProceso({
        sirh: data.sirh,
        envio_ordinario: false,
        tipo_proceso: data.tipo_proceso,
        numero_resolucion: data.numero_resolucion,
        fecha_resolucion: Timestamp.fromDate(new Date(data.fecha_resolucion)),
        por_cgr: data.por_cgr,
        detalle: data.detalle,
        etapa: 'INDAGATORIA_VIGENTE', // Se calcula automáticamente
        fecha_notificacion: Timestamp.fromDate(new Date(data.fecha_notificacion)),
        fiscal_actual: {
          nombre: data.fiscal_nombre,
          fecha_asignacion: Timestamp.fromDate(new Date(data.fecha_notificacion)),
        },
        activo: true,
        resolucion_final: null,
        tipo_resultado: null,
        detalle_resultado: null,
        funcionario: null,
        enviado_cgr: false,
        memo_entrega_direccion: null,
        revision_juridica: null,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creando proceso:', error);
      showError('Error al crear el proceso');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-text">Nuevo Proceso Sumarial</h2>
            <p className="text-gray-600">Completa la información del proceso</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  N° Resolución *
                </label>
                <input
                  {...register('numero_resolucion')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Ej: RES-2024-001"
                />
                {errors.numero_resolucion && (
                  <p className="mt-1 text-sm text-red-600">{errors.numero_resolucion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha Resolución *
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

          {/* Etapa y Fiscal */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Etapa y Fiscal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Etapa Actual *
                </label>
                <input
                  type="text"
                  value="Indagatoria Vigente"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  title="La etapa se calcula automáticamente basada en plazos y prórrogas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se calcula automáticamente según plazos y prórrogas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha Notificación *
                </label>
                <input
                  {...register('fecha_notificacion')}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                />
                {errors.fecha_notificacion && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha_notificacion.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">
                  Fiscal Asignado *
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
            </div>
          </div>

          {/* Checkboxes */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Indicadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all group has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300">
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
                <div className="ml-4">
                  <span className="text-sm font-medium text-text">SIRH</span>
                  <p className="text-xs text-gray-500">Sistema Integral de Recursos Humanos</p>
                </div>
              </label>
              <label className="relative flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all group has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300">
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
                <div className="ml-4">
                  <span className="text-sm font-medium text-text">Por CGR</span>
                  <p className="text-xs text-gray-500">Contraloría General de la República</p>
                </div>
              </label>
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
              <span>{isLoading ? 'Creando...' : 'Crear Proceso'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
