import ExcelJS from 'exceljs';
import { ProcesoSumarial, CicloFiscal } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProcesoConCiclos {
  proceso: ProcesoSumarial;
  cicloActivo?: CicloFiscal;
  ciclosAnteriores?: CicloFiscal[];
}

const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy', { locale: es });
};

const formatDateTime = (date: Date): string => {
  return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm 'hrs'", { locale: es });
};

const getEtapaLabel = (etapa: string): string => {
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

const getTipoRevisionLabel = (tipo: string | null): string => {
  if (!tipo) return '-';
  switch (tipo) {
    case 'reapertura':
      return 'Reapertura';
    case 'acoge_propuesta_fiscal':
      return 'Acoge Propuesta del Fiscal';
    case 'pendiente_de_revision':
      return 'Pendiente de Revisión';
    default:
      return tipo;
  }
};

const getTipoResultadoLabel = (tipo: string | null): string => {
  if (!tipo) return '-';
  switch (tipo) {
    case 'medida_disciplinaria':
      return 'Medida Disciplinaria';
    case 'sobreseimiento':
      return 'Sobreseimiento';
    case 'absolucion':
      return 'Absolución';
    default:
      return tipo;
  }
};

// Colores corporativos
const COLORS = {
  primary: '1E3A5F',      // Azul oscuro
  secondary: '2E5A8F',    // Azul medio
  accent: '4A90D9',       // Azul claro
  success: '10B981',      // Verde
  warning: 'F59E0B',      // Amarillo/Naranja
  danger: 'EF4444',       // Rojo
  purple: '8B5CF6',       // Púrpura
  gray: '6B7280',         // Gris
  lightGray: 'F3F4F6',    // Gris claro
  white: 'FFFFFF',
};

// Crear hoja de procesos principales
const crearHojaProcesos = async (
  workbook: ExcelJS.Workbook,
  datos: ProcesoConCiclos[],
  fechaCreacion: string
) => {
  const worksheet = workbook.addWorksheet('Procesos Sumariales', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  // Definir cabeceras
  const headers = [
    'N° Resolución',
    'Tipo de Proceso',
    'Fecha Resolución',
    'Fecha Notificación',
    'Etapa',
    'Estado',
    'Fiscal Actual',
    'Fecha Asignación Fiscal',
    'Fecha Notificación Fiscal',
    'Plazo 20 días - Inicio',
    'Plazo 20 días - Término',
    'Plazo 40 días - Inicio',
    'Plazo 40 días - Término',
    'Plazo 60 días - Inicio',
    'Plazo 60 días - Término',
    'Prórroga 1 - Resolución',
    'Prórroga 1 - Fecha',
    'Prórroga 2 - Resolución',
    'Prórroga 2 - Fecha',
    'Detalle',
    'Funcionario',
    'Por CGR',
    'SIRH',
    'Envío Ordinario',
    'Enviado a CGR',
    'Revisión Jurídica',
    'Tipo Revisión',
    'Memo Revisión',
    'Fecha Revisión',
    'Resolución Final',
    'Resultado',
    'Detalle Resultado',
    'Memo Entrega Dirección',
  ];

  // Fila 1: Título
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'REPORTE DE PROCESOS SUMARIALES';
  titleCell.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.primary },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Fila 2: Fecha de creación
  worksheet.mergeCells('A2:H2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Fecha de generación: ${fechaCreacion}`;
  dateCell.font = { italic: true, size: 11, color: { argb: COLORS.gray } };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.lightGray },
  };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Fila 3: Vacía
  worksheet.getRow(3).height = 10;

  // Fila 4: Cabeceras
  const headerRow = worksheet.getRow(4);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: COLORS.white } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.secondary },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.primary } },
      bottom: { style: 'thin', color: { argb: COLORS.primary } },
      left: { style: 'thin', color: { argb: COLORS.primary } },
      right: { style: 'thin', color: { argb: COLORS.primary } },
    };
  });
  headerRow.height = 30;

  // Agregar datos
  datos.forEach(({ proceso, cicloActivo }, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 5);
    const isEven = rowIndex % 2 === 0;

    const rowData = [
      proceso.numero_resolucion,
      proceso.tipo_proceso,
      formatDate(proceso.fecha_resolucion.toDate()),
      formatDate(proceso.fecha_notificacion.toDate()),
      getEtapaLabel(proceso.etapa),
      proceso.activo ? 'Activo' : 'Inactivo',
      proceso.fiscal_actual.nombre,
      formatDate(proceso.fiscal_actual.fecha_asignacion.toDate()),
      cicloActivo?.fecha_notificacion
        ? formatDate(cicloActivo.fecha_notificacion.toDate())
        : '-',
      cicloActivo?.plazos.plazo_20
        ? formatDate(cicloActivo.plazos.plazo_20.inicio.toDate())
        : '-',
      cicloActivo?.plazos.plazo_20
        ? formatDate(cicloActivo.plazos.plazo_20.termino.toDate())
        : '-',
      cicloActivo?.plazos.plazo_40
        ? formatDate(cicloActivo.plazos.plazo_40.inicio.toDate())
        : '-',
      cicloActivo?.plazos.plazo_40
        ? formatDate(cicloActivo.plazos.plazo_40.termino.toDate())
        : '-',
      cicloActivo?.plazos.plazo_60
        ? formatDate(cicloActivo.plazos.plazo_60.inicio.toDate())
        : '-',
      cicloActivo?.plazos.plazo_60
        ? formatDate(cicloActivo.plazos.plazo_60.termino.toDate())
        : '-',
      cicloActivo?.prorroga_1?.numero_resolucion || '-',
      cicloActivo?.prorroga_1?.fecha_resolucion
        ? formatDate(cicloActivo.prorroga_1.fecha_resolucion.toDate())
        : '-',
      cicloActivo?.prorroga_2?.numero_resolucion || '-',
      cicloActivo?.prorroga_2?.fecha_resolucion
        ? formatDate(cicloActivo.prorroga_2.fecha_resolucion.toDate())
        : '-',
      proceso.detalle,
      proceso.funcionario || '-',
      proceso.por_cgr ? 'Sí' : 'No',
      proceso.sirh ? 'Sí' : 'No',
      proceso.envio_ordinario ? 'Sí' : 'No',
      proceso.enviado_cgr ? 'Sí' : 'No',
      proceso.revision_juridica?.revision_realizada ? 'Sí' : 'No',
      getTipoRevisionLabel(proceso.revision_juridica?.tipo_revision || null),
      proceso.revision_juridica?.numero_memo || '-',
      proceso.revision_juridica?.fecha_revision
        ? formatDate(proceso.revision_juridica.fecha_revision.toDate())
        : '-',
      proceso.resolucion_final || '-',
      getTipoResultadoLabel(proceso.tipo_resultado),
      proceso.detalle_resultado || '-',
      proceso.memo_entrega_direccion || '-',
    ];

    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.white : COLORS.lightGray },
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
      };

      // Colorear celdas de estado
      if (colIndex === 5) { // Estado
        if (value === 'Activo') {
          cell.font = { size: 9, bold: true, color: { argb: COLORS.success } };
        } else if (value === 'Concluido') {
          cell.font = { size: 9, bold: true, color: { argb: COLORS.purple } };
        } else {
          cell.font = { size: 9, color: { argb: COLORS.gray } };
        }
      }

      // Colorear celdas de etapa
      if (colIndex === 4) { // Etapa
        if (value === 'Indagatoria Vigente') {
          cell.font = { size: 9, color: { argb: COLORS.success } }; // Verde para vigente
        } else if (value === 'Indagatoria Fuera de Plazo') {
          cell.font = { size: 9, color: { argb: COLORS.danger } }; // Rojo para fuera de plazo
        } else if (value === 'Concluido') {
          cell.font = { size: 9, color: { argb: COLORS.purple } }; // Púrpura para concluido
        }
      }

      // Colorear Sí/No
      if (value === 'Sí') {
        cell.font = { size: 9, color: { argb: COLORS.success } };
      } else if (value === 'No' && typeof value === 'string') {
        cell.font = { size: 9, color: { argb: COLORS.danger } };
      }
    });

    row.height = 22;
  });

  // Ajustar ancho de columnas
  const columnWidths = [
    15, 20, 12, 12, 15, 12, 25, 15, 15,
    12, 12, 12, 12, 12, 12,
    15, 12, 15, 12,
    40, 20, 8, 8, 12, 12,
    12, 22, 15, 12,
    15, 18, 25, 20
  ];

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  // Agregar autofilter
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: datos.length + 4, column: headers.length },
  };
};

// Crear hoja de historial de fiscales
const crearHojaHistorialFiscales = async (
  workbook: ExcelJS.Workbook,
  datos: ProcesoConCiclos[],
  fechaCreacion: string
) => {
  const worksheet = workbook.addWorksheet('Historial Fiscales', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const headers = [
    'N° Resolución Proceso',
    'Fiscal',
    'Estado Ciclo',
    'Fecha Inicio',
    'Fecha Notificación',
    'Motivo Cambio',
    'Plazo 20 - Inicio',
    'Plazo 20 - Término',
    'Plazo 40 - Inicio',
    'Plazo 40 - Término',
    'Plazo 60 - Inicio',
    'Plazo 60 - Término',
    'Prórroga 1 - Resolución',
    'Prórroga 1 - Fecha',
    'Prórroga 2 - Resolución',
    'Prórroga 2 - Fecha',
  ];

  // Fila 1: Título
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'HISTORIAL DE FISCALES';
  titleCell.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.purple },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Fila 2: Fecha de creación
  worksheet.mergeCells('A2:F2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Fecha de generación: ${fechaCreacion}`;
  dateCell.font = { italic: true, size: 11, color: { argb: COLORS.gray } };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.lightGray },
  };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Fila 3: Vacía
  worksheet.getRow(3).height = 10;

  // Fila 4: Cabeceras
  const headerRow = worksheet.getRow(4);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: COLORS.white } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7C3AED' }, // Púrpura más oscuro
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.purple } },
      bottom: { style: 'thin', color: { argb: COLORS.purple } },
      left: { style: 'thin', color: { argb: COLORS.purple } },
      right: { style: 'thin', color: { argb: COLORS.purple } },
    };
  });
  headerRow.height = 30;

  // Recopilar todos los ciclos
  let currentRow = 5;
  datos.forEach(({ proceso, cicloActivo, ciclosAnteriores }) => {
    const todosCiclos: CicloFiscal[] = [];

    if (cicloActivo) {
      todosCiclos.push(cicloActivo);
    }

    if (ciclosAnteriores && ciclosAnteriores.length > 0) {
      todosCiclos.push(...ciclosAnteriores);
    }

    // Ordenar por fecha de inicio descendente
    todosCiclos.sort((a, b) => {
      const fechaA = a.fecha_inicio?.toDate?.() || new Date(0);
      const fechaB = b.fecha_inicio?.toDate?.() || new Date(0);
      return fechaB.getTime() - fechaA.getTime();
    });

    todosCiclos.forEach((ciclo) => {
      const row = worksheet.getRow(currentRow);
      const isEven = (currentRow - 5) % 2 === 0;

      const rowData = [
        proceso.numero_resolucion,
        ciclo.fiscal,
        ciclo.activo ? 'Activo' : 'Anterior',
        ciclo.fecha_inicio ? formatDate(ciclo.fecha_inicio.toDate()) : '-',
        ciclo.fecha_notificacion ? formatDate(ciclo.fecha_notificacion.toDate()) : '-',
        ciclo.motivo_cambio || '-',
        ciclo.plazos?.plazo_20
          ? formatDate(ciclo.plazos.plazo_20.inicio.toDate())
          : '-',
        ciclo.plazos?.plazo_20
          ? formatDate(ciclo.plazos.plazo_20.termino.toDate())
          : '-',
        ciclo.plazos?.plazo_40
          ? formatDate(ciclo.plazos.plazo_40.inicio.toDate())
          : '-',
        ciclo.plazos?.plazo_40
          ? formatDate(ciclo.plazos.plazo_40.termino.toDate())
          : '-',
        ciclo.plazos?.plazo_60
          ? formatDate(ciclo.plazos.plazo_60.inicio.toDate())
          : '-',
        ciclo.plazos?.plazo_60
          ? formatDate(ciclo.plazos.plazo_60.termino.toDate())
          : '-',
        ciclo.prorroga_1?.numero_resolucion || '-',
        ciclo.prorroga_1?.fecha_resolucion
          ? formatDate(ciclo.prorroga_1.fecha_resolucion.toDate())
          : '-',
        ciclo.prorroga_2?.numero_resolucion || '-',
        ciclo.prorroga_2?.fecha_resolucion
          ? formatDate(ciclo.prorroga_2.fecha_resolucion.toDate())
          : '-',
      ];

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.font = { size: 9 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? COLORS.white : 'F5F3FF' }, // Púrpura muy claro
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        };

        // Colorear estado del ciclo
        if (colIndex === 2) {
          if (value === 'Activo') {
            cell.font = { size: 9, bold: true, color: { argb: COLORS.success } };
          } else {
            cell.font = { size: 9, color: { argb: COLORS.gray } };
          }
        }
      });

      row.height = 22;
      currentRow++;
    });
  });

  // Ajustar ancho de columnas
  const columnWidths = [18, 25, 12, 12, 15, 25, 12, 12, 12, 12, 12, 12, 18, 12, 18, 12];
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  // Agregar autofilter
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: currentRow - 1, column: headers.length },
  };
};

export const exportarProcesosAExcel = async (
  datos: ProcesoConCiclos[],
  fechaInicio?: Date,
  fechaFin?: Date
) => {
  // Filtrar por rango de fechas si se especifica
  let datosFiltrados = datos;

  if (fechaInicio || fechaFin) {
    datosFiltrados = datos.filter(({ proceso }) => {
      const fechaResolucion = proceso.fecha_resolucion.toDate();

      if (fechaInicio && fechaFin) {
        return fechaResolucion >= fechaInicio && fechaResolucion <= fechaFin;
      } else if (fechaInicio) {
        return fechaResolucion >= fechaInicio;
      } else if (fechaFin) {
        return fechaResolucion <= fechaFin;
      }
      return true;
    });
  }

  const fechaCreacion = formatDateTime(new Date());

  // Crear el libro de trabajo
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Sumariales';
  workbook.created = new Date();

  // Crear hojas
  await crearHojaProcesos(workbook, datosFiltrados, fechaCreacion);
  await crearHojaHistorialFiscales(workbook, datosFiltrados, fechaCreacion);

  // Generar nombre del archivo con fecha
  const fechaExportacion = format(new Date(), 'yyyy-MM-dd_HH-mm');
  let nombreArchivo = `procesos_sumariales_${fechaExportacion}`;

  if (fechaInicio && fechaFin) {
    nombreArchivo = `procesos_sumariales_${format(fechaInicio, 'yyyy-MM-dd')}_a_${format(fechaFin, 'yyyy-MM-dd')}`;
  }

  // Descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nombreArchivo}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);

  return datosFiltrados.length;
};
