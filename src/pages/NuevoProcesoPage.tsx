import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/layouts/MainLayout';
import { useProcesos } from '@/hooks/useProcesos';
import { Timestamp } from 'firebase/firestore';
import { ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
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

export const NuevoProcesoPage = () => {
  const navigate = useNavigate();
  const { crearProceso } = useProcesos();
  const { error: showError } = useNotificationContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcesoFormData>({
    resolver: zodResolver(procesoSchema),
    defaultValues: {
      sirh: false,
      por_cgr: false,
    },
  });

  // Reset form on mount to ensure clean state
  useEffect(() => {
    reset();
  }, [reset]);

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
      });

      navigate('/procesos');
    } catch (error) {
      console.error('Error al crear proceso:', error);
      showError('Error al crear el proceso');
    } finally {
      setIsLoading(false);
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
            <h2 className="text-2xl font-bold text-text">Nuevo Proceso Sumarial</h2>
            <p className="text-gray-600">Completa la información del proceso</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl p-8 border border-primary-100 shadow-sm space-y-6">
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
                  placeholder="Descripción del proceso"
                />
                {errors.detalle && (
                  <p className="mt-1 text-sm text-red-600">{errors.detalle.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fiscal */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Fiscal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fecha Notificación *
                </label>
                <input
                  {...register('fecha_notificacion')}
                  type="date"
                  autoComplete="off"
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
                  autoComplete="off"
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

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/procesos')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-200 hover:bg-primary-300 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              <span>{isLoading ? 'Guardando...' : 'Crear Proceso'}</span>
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
