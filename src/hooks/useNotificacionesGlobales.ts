import { useMemo } from 'react';
import {
  useNotificacionesRevision,
  useNotificacionesPlazoVencido,
} from '@/hooks/useNotificacionesRevision';
import { NotificacionGlobal } from '@/types/notificaciones';

export const useNotificacionesGlobales = () => {
  const revision = useNotificacionesRevision();
  const plazo = useNotificacionesPlazoVencido();

  const notificaciones: NotificacionGlobal[] = useMemo(() => {
    const revisiones: NotificacionGlobal[] = revision.notificaciones.map(n => ({
      id: n.id,
      tipo: 'revision' as const,
      leida: n.leida,
      fecha: n.fechaRevision,
      procesoId: n.procesoId,
      numeroResolucion: n.numeroResolucion,
      tipoRevision: n.tipoRevision,
    }));

    const plazos: NotificacionGlobal[] = plazo.notificaciones.map(n => ({
      id: n.id,
      tipo: 'plazo' as const,
      leida: n.leida,
      fecha: n.fechaVencimiento,
      procesoId: n.procesoId,
      nombreProceso: n.nombreProceso,
      nombrePlazo: n.nombrePlazo,
    }));

    return [...revisiones, ...plazos].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }, [revision.notificaciones, plazo.notificaciones]);

  const notificacionesNoLeidas = useMemo(
    () => notificaciones.filter(n => !n.leida),
    [notificaciones]
  );

  const cantidadNoLeidas = notificacionesNoLeidas.length;

  const marcarComoLeida = (id: string, tipo: 'revision' | 'plazo') => {
    if (tipo === 'revision') {
      revision.marcarComoLeida(id);
    } else {
      plazo.marcarComoLeida(id);
    }
  };

  const marcarTodasComoLeidas = () => {
    revision.marcarTodasComoLeidas();
    plazo.marcarTodasComoLeidas();
  };

  const loading = revision.loading || plazo.loading;

  return {
    notificaciones,
    notificacionesNoLeidas,
    cantidadNoLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
  };
};
