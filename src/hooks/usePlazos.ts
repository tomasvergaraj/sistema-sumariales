import { differenceInDays, startOfDay } from 'date-fns';
import { EstadoPlazo, EstadoPlazoFiscal, CicloFiscal, Ordinario } from '@/types';
import { diferenciaDiasHabiles } from '@/utils/diasHabiles';

export const calcularEstadoPlazo = (fechaTermino: Date): EstadoPlazo => {
  // Normalizar ambas fechas a inicio del día para comparación correcta
  const hoy = startOfDay(new Date());
  const termino = startOfDay(new Date(fechaTermino));
  const diasRestantes = differenceInDays(termino, hoy);

  if (diasRestantes < 0) {
    return 'vencido';
  } else if (diasRestantes <= 5) {
    return 'por-vencer';
  } else {
    return 'vigente';
  }
};

export const obtenerColorEstadoPlazo = (estado: EstadoPlazo): string => {
  switch (estado) {
    case 'vigente':
      return 'text-green-600 bg-green-50';
    case 'por-vencer':
      return 'text-yellow-600 bg-yellow-50';
    case 'vencido':
      return 'text-red-600 bg-red-50';
  }
};

export const obtenerTextoEstadoPlazo = (estado: EstadoPlazo): string => {
  switch (estado) {
    case 'vigente':
      return 'Vigente';
    case 'por-vencer':
      return 'Por vencer';
    case 'vencido':
      return 'Vencido';
  }
};

export const formatearFecha = (fecha: Date): string => {
  return fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Calcula el estado del plazo fiscal según la lógica de negocio:
 * - VIGENTE: Dentro del plazo base (20 días hábiles desde notificación)
 * - VENCIDO: Plazo base vencido (sin prórroga), sin ordinario enviado
 * - VENCIDO_NOTIFICADO: Plazo vencido con ordinario enviado (20 días hábiles para regularizar)
 * - PRORROGADO: Prórroga aprobada y activa (dentro del plazo extendido)
 * - PRORROGA_VENCIDA: Prórroga venció sin solicitar siguiente prórroga a tiempo
 * - CERRADO: Proceso concluido
 */
export const calcularEstadoPlazoFiscal = (
  ciclo: CicloFiscal,
  procesoCerrado: boolean = false
): EstadoPlazoFiscal => {
  // Si el proceso está cerrado
  if (procesoCerrado) {
    return 'CERRADO';
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Usar las fechas de término pre-calculadas en los plazos
  const termino20 = ciclo.plazos.plazo_20?.termino?.toDate();
  const termino40 = ciclo.plazos.plazo_40?.termino?.toDate();
  const termino60 = ciclo.plazos.plazo_60?.termino?.toDate();

  if (termino20) termino20.setHours(0, 0, 0, 0);
  if (termino40) termino40.setHours(0, 0, 0, 0);
  if (termino60) termino60.setHours(0, 0, 0, 0);

  const tieneProrroga1 = !!ciclo.prorroga_1;
  const tieneProrroga2 = !!ciclo.prorroga_2;

  // Determinar cuál ordinario aplica según el contexto de prórrogas
  const ordinarioAplicable = obtenerOrdinarioAplicable(ciclo);

  // Lógica de estados según prórrogas
  if (!tieneProrroga1) {
    // Sin prórrogas: plazo base de 20 días
    if (termino20 && hoy <= termino20) {
      return 'VIGENTE';
    }
    // Vencido el plazo de 20 días (sin prórroga)
    if (ordinarioAplicable) {
      return 'VENCIDO_NOTIFICADO';
    }
    return 'VENCIDO';
  }

  if (tieneProrroga1 && !tieneProrroga2) {
    // Con prórroga 1: plazo extendido a 40 días
    if (termino40 && hoy <= termino40) {
      return 'PRORROGADO';
    }
    // Vencido el plazo de 40 días (prórroga 1 venció sin solicitar prórroga 2)
    if (ordinarioAplicable) {
      return 'VENCIDO_NOTIFICADO';
    }
    return 'PRORROGA_VENCIDA';
  }

  if (tieneProrroga2) {
    // Con prórroga 2: plazo extendido a 60 días (máximo)
    if (termino60 && hoy <= termino60) {
      return 'PRORROGADO';
    }
    // Vencido el plazo de 60 días (prórroga 2 venció - no hay más prórrogas posibles)
    if (ordinarioAplicable) {
      return 'VENCIDO_NOTIFICADO';
    }
    return 'PRORROGA_VENCIDA';
  }

  return 'VIGENTE';
};

/**
 * Obtiene el ordinario aplicable según el contexto de prórrogas del ciclo
 */
const obtenerOrdinarioAplicable = (ciclo: CicloFiscal): Ordinario | null => {
  const tieneProrroga1 = !!ciclo.prorroga_1;
  const tieneProrroga2 = !!ciclo.prorroga_2;

  if (!tieneProrroga1 && ciclo.ordinario_20) {
    return ciclo.ordinario_20;
  }
  if (tieneProrroga1 && !tieneProrroga2 && ciclo.ordinario_40) {
    return ciclo.ordinario_40;
  }
  if (tieneProrroga2 && ciclo.ordinario_60) {
    return ciclo.ordinario_60;
  }
  return null;
};

/**
 * Obtiene el color del estado del plazo fiscal para UI
 */
export const obtenerColorEstadoPlazoFiscal = (estado: EstadoPlazoFiscal): string => {
  switch (estado) {
    case 'VIGENTE':
      return 'text-green-600 bg-green-50';
    case 'PRORROGADO':
      return 'text-blue-600 bg-blue-50';
    case 'VENCIDO':
      return 'text-red-600 bg-red-50';
    case 'PRORROGA_VENCIDA':
      return 'text-red-700 bg-red-100';
    case 'VENCIDO_NOTIFICADO':
      return 'text-orange-600 bg-orange-50';
    case 'CERRADO':
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Obtiene el texto del estado del plazo fiscal para UI
 */
export const obtenerTextoEstadoPlazoFiscal = (estado: EstadoPlazoFiscal): string => {
  switch (estado) {
    case 'VIGENTE':
      return 'Vigente';
    case 'PRORROGADO':
      return 'Prorrogado';
    case 'VENCIDO':
      return 'Vencido';
    case 'PRORROGA_VENCIDA':
      return 'Prórroga Vencida';
    case 'VENCIDO_NOTIFICADO':
      return 'Vencido - Notificado';
    case 'CERRADO':
      return 'Cerrado';
  }
};

/**
 * Valida si una prórroga puede ser registrada según la fecha de ingreso.
 * - Prórroga 1: debe solicitarse dentro del plazo original de 20 días hábiles (día 0-20)
 * - Prórroga 2: debe solicitarse dentro del plazo de la primera prórroga (día 20-40)
 */
export const validarFechaProrroga = (
  fechaNotificacion: Date,
  fechaIngresoProrroga: Date,
  tipoProrroga: 'prorroga_1' | 'prorroga_2' = 'prorroga_1'
): { valido: boolean; mensaje: string } => {
  const notificacion = new Date(fechaNotificacion);
  notificacion.setHours(0, 0, 0, 0);

  const ingreso = new Date(fechaIngresoProrroga);
  ingreso.setHours(0, 0, 0, 0);

  const diasHabilesTranscurridos = diferenciaDiasHabiles(notificacion, ingreso);

  if (tipoProrroga === 'prorroga_1') {
    // Primera prórroga: debe estar dentro de los primeros 20 días hábiles
    if (diasHabilesTranscurridos > 20) {
      return {
        valido: false,
        mensaje: `La primera prórroga debe solicitarse dentro de los 20 días hábiles del plazo original. Han transcurrido ${diasHabilesTranscurridos} días hábiles.`
      };
    }
  } else {
    // Segunda prórroga: debe estar dentro del período de la primera prórroga (día 20-40)
    if (diasHabilesTranscurridos <= 20) {
      return {
        valido: false,
        mensaje: `La segunda prórroga debe solicitarse después de los primeros 20 días hábiles (período de la primera prórroga). Han transcurrido solo ${diasHabilesTranscurridos} días hábiles.`
      };
    }
    if (diasHabilesTranscurridos > 40) {
      return {
        valido: false,
        mensaje: `La segunda prórroga debe solicitarse dentro de los 40 días hábiles (período de la primera prórroga). Han transcurrido ${diasHabilesTranscurridos} días hábiles.`
      };
    }
  }

  return { valido: true, mensaje: '' };
};
