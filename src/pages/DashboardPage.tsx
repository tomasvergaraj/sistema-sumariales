import { useMemo, useEffect, useRef } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useProcesos } from '@/hooks/useProcesos';
import { calcularEstadoPlazo } from '@/hooks/usePlazos';
import {
  FolderOpen,
  FolderCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { DashboardStats, EtapaProceso } from '@/types';
import { ExportarDatos } from '@/components/ExportarDatos';

export const DashboardPage = () => {
  const { procesos, loading, actualizarEtapasAutomaticas } = useProcesos();
  const etapasActualizadas = useRef(false);

  // Actualizar etapas automáticamente cuando se carga el dashboard
  useEffect(() => {
    if (!loading && procesos.length > 0 && !etapasActualizadas.current) {
      etapasActualizadas.current = true;
      actualizarEtapasAutomaticas();
    }
  }, [loading, procesos.length, actualizarEtapasAutomaticas]);

  const stats: DashboardStats = useMemo(() => {
    const total_procesos = procesos.length;
    const procesos_activos = procesos.filter((p) => p.activo).length;

    const por_etapa: Record<EtapaProceso, number> = {
      INDAGATORIA_VIGENTE: 0,
      INDAGATORIA_FUERA_PLAZO: 0,
      CONCLUIDO: 0,
    };

    let plazos_vigentes = 0;
    let plazos_por_vencer = 0;
    let plazos_vencidos = 0;

    procesos.forEach((proceso) => {
      por_etapa[proceso.etapa]++;

      // Aquí deberíamos obtener el ciclo fiscal activo y calcular el estado del plazo
      // Por simplicidad, usamos una lógica básica
      if (proceso.activo) {
        const hoy = new Date();
        // Esta es una simplificación - en producción deberías obtener el ciclo actual
        const estado = calcularEstadoPlazo(hoy);
        
        if (estado === 'vigente') plazos_vigentes++;
        if (estado === 'por-vencer') plazos_por_vencer++;
        if (estado === 'vencido') plazos_vencidos++;
      }
    });

    return {
      total_procesos,
      procesos_activos,
      por_etapa,
      plazos_vigentes,
      plazos_por_vencer,
      plazos_vencidos,
    };
  }, [procesos]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
        </div>
      </MainLayout>
    );
  }

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    color: string 
  }) => (
    <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">Dashboard</h2>
          <p className="text-gray-600">Resumen general del sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={FolderOpen}
            label="Total de Procesos"
            value={stats.total_procesos}
            color="bg-primary-200"
          />
          <StatCard
            icon={FolderCheck}
            label="Procesos Activos"
            value={stats.procesos_activos}
            color="bg-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Procesos Concluidos"
            value={stats.por_etapa.CONCLUIDO}
            color="bg-green-400"
          />
        </div>

        {/* Etapas */}
        <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
          <h3 className="text-lg font-semibold text-text mb-4">Procesos por Etapa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Indagatoria Vigente</p>
              <p className="text-2xl font-bold text-text">{stats.por_etapa.INDAGATORIA_VIGENTE}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Indagatoria Fuera de Plazo</p>
              <p className="text-2xl font-bold text-text">{stats.por_etapa.INDAGATORIA_FUERA_PLAZO}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Concluido</p>
              <p className="text-2xl font-bold text-text">{stats.por_etapa.CONCLUIDO}</p>
            </div>
          </div>
        </div>

        {/* Plazos */}
        <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
          <h3 className="text-lg font-semibold text-text mb-4">Estado de Plazos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <Clock size={32} className="text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Vigentes</p>
                <p className="text-2xl font-bold text-green-600">{stats.plazos_vigentes}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle size={32} className="text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Por Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.plazos_por_vencer}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
              <XCircle size={32} className="text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.plazos_vencidos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exportar Datos */}
        <ExportarDatos procesos={procesos} />
      </div>
    </MainLayout>
  );
};
