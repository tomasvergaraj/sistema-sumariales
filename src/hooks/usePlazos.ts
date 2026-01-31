import { differenceInDays, startOfDay } from 'date-fns';
import { EstadoPlazo } from '@/types';

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
