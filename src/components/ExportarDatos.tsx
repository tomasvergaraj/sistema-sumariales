import { useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProcesoSumarial, CicloFiscal } from '@/types';
import { exportarProcesosAExcel } from '@/utils/exportToExcel';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';

interface ExportarDatosProps {
  procesos: ProcesoSumarial[];
}

export const ExportarDatos = ({ procesos }: ExportarDatosProps) => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [exportando, setExportando] = useState(false);
  const { success, error: showError } = useNotificationContext();

  const handleExportar = async () => {
    try {
      setExportando(true);

      // Obtener todos los ciclos fiscales de cada proceso (activo y anteriores)
      const datosConCiclos = await Promise.all(
        procesos.map(async (proceso) => {
          if (!proceso.id) return { proceso, cicloActivo: undefined, ciclosAnteriores: [] };

          const ciclosRef = collection(db, 'procesos_sumariales', proceso.id, 'ciclos_fiscal');
          const q = query(ciclosRef, orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);

          const ciclos = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as CicloFiscal[];

          const cicloActivo = ciclos.find(c => c.activo);
          const ciclosAnteriores = ciclos.filter(c => !c.activo);

          return { proceso, cicloActivo, ciclosAnteriores };
        })
      );

      // Exportar a Excel
      const cantidadExportados = await exportarProcesosAExcel(
        datosConCiclos,
        fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin ? new Date(fechaFin + 'T23:59:59') : undefined
      );

      success(`Se exportaron ${cantidadExportados} procesos correctamente a Excel`);
    } catch (error) {
      console.error('Error al exportar:', error);
      showError('Error al exportar los datos');
    } finally {
      setExportando(false);
    }
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <FileSpreadsheet className="text-primary-200" size={24} />
        <h3 className="text-lg font-semibold text-text">Exportar Datos</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Exporta los procesos sumariales a un archivo Excel. Puedes filtrar por rango de fechas de resolución.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={14} className="inline mr-1" />
            Fecha Inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={14} className="inline mr-1" />
            Fecha Fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 outline-none"
          />
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download size={18} />
            <span>{exportando ? 'Exportando...' : 'Exportar Excel'}</span>
          </button>

          {(fechaInicio || fechaFin) && (
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {!fechaInicio && !fechaFin && (
        <p className="text-xs text-gray-500">
          Sin filtro de fechas se exportarán todos los {procesos.length} procesos
        </p>
      )}

      {(fechaInicio || fechaFin) && (
        <p className="text-xs text-primary-300">
          Se filtrarán los procesos por fecha de resolución
          {fechaInicio && ` desde ${fechaInicio}`}
          {fechaFin && ` hasta ${fechaFin}`}
        </p>
      )}
    </div>
  );
};
