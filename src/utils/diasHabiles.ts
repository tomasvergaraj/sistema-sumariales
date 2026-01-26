/**
 * Utilidad para calcular días hábiles en Chile
 * Considera solo lunes a viernes y excluye feriados irrenunciables
 */

// Feriados irrenunciables de Chile (fecha fija)
const FERIADOS_FIJOS = [
  { mes: 0, dia: 1 },   // 1 de enero - Año Nuevo
  { mes: 4, dia: 1 },   // 1 de mayo - Día del Trabajo
  { mes: 4, dia: 21 },  // 21 de mayo - Glorias Navales
  { mes: 5, dia: 20 },  // 20 de junio - Día de los Pueblos Indígenas (aproximado)
  { mes: 6, dia: 16 },  // 16 de julio - Virgen del Carmen
  { mes: 7, dia: 15 },  // 15 de agosto - Asunción de la Virgen
  { mes: 8, dia: 18 },  // 18 de septiembre - Primera Junta Nacional
  { mes: 8, dia: 19 },  // 19 de septiembre - Glorias del Ejército
  { mes: 9, dia: 12 },  // 12 de octubre - Encuentro de Dos Mundos
  { mes: 9, dia: 31 },  // 31 de octubre - Iglesias Evangélicas
  { mes: 10, dia: 1 },  // 1 de noviembre - Día de Todos los Santos
  { mes: 11, dia: 8 },  // 8 de diciembre - Inmaculada Concepción
  { mes: 11, dia: 25 }, // 25 de diciembre - Navidad
];

/**
 * Calcula la fecha de Viernes Santo para un año dado
 * Usando el algoritmo de Meeus/Jones/Butcher
 */
function calcularPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

/**
 * Obtiene los feriados móviles para un año (Viernes Santo y Sábado Santo)
 */
function getFeriadosMoviles(year: number): Date[] {
  const pascua = calcularPascua(year);

  // Viernes Santo (2 días antes de Pascua)
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  // Sábado Santo (1 día antes de Pascua)
  const sabadoSanto = new Date(pascua);
  sabadoSanto.setDate(pascua.getDate() - 1);

  return [viernesSanto, sabadoSanto];
}

/**
 * Verifica si una fecha es feriado
 */
function esFeriado(fecha: Date): boolean {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const day = fecha.getDate();

  // Verificar feriados fijos
  for (const feriado of FERIADOS_FIJOS) {
    if (feriado.mes === month && feriado.dia === day) {
      return true;
    }
  }

  // Verificar feriados móviles (Semana Santa)
  const feriadosMoviles = getFeriadosMoviles(year);
  for (const feriadoMovil of feriadosMoviles) {
    if (
      feriadoMovil.getMonth() === month &&
      feriadoMovil.getDate() === day
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si una fecha es fin de semana (sábado o domingo)
 */
function esFinDeSemana(fecha: Date): boolean {
  const dayOfWeek = fecha.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Domingo = 0, Sábado = 6
}

/**
 * Verifica si una fecha es día hábil (lunes a viernes y no feriado)
 */
export function esDiaHabil(fecha: Date): boolean {
  return !esFinDeSemana(fecha) && !esFeriado(fecha);
}

/**
 * Agrega días hábiles a una fecha
 * @param fecha - Fecha inicial
 * @param diasHabiles - Número de días hábiles a agregar
 * @returns Nueva fecha después de agregar los días hábiles
 */
export function addDiasHabiles(fecha: Date, diasHabiles: number): Date {
  const resultado = new Date(fecha);
  let diasAgregados = 0;

  while (diasAgregados < diasHabiles) {
    resultado.setDate(resultado.getDate() + 1);

    if (esDiaHabil(resultado)) {
      diasAgregados++;
    }
  }

  return resultado;
}

/**
 * Calcula la diferencia en días hábiles entre dos fechas
 * @param fechaInicio - Fecha de inicio
 * @param fechaFin - Fecha de fin
 * @returns Número de días hábiles entre las dos fechas
 */
export function diferenciaDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
  let diasHabiles = 0;
  const current = new Date(fechaInicio);

  while (current < fechaFin) {
    current.setDate(current.getDate() + 1);

    if (esDiaHabil(current)) {
      diasHabiles++;
    }
  }

  return diasHabiles;
}
