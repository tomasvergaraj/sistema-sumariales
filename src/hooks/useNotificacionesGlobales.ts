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
    const revisiones = revision.notificaciones.map(n => ({
      ...n,
      tipo: 'revision' as const,
    }));

    const plazos = plazo.notificaciones.map(n => ({
      ...n,
      tipo: 'plazo' as const,
    }));

    return [...revisiones, ...plazos].sort((a, b) => {
      const fechaA =
        a.tipo === 'revision'
          ? a.fechaRevision.getTime()
          : a.fechaVencimiento.getTime();

      const fechaB =
        b.tipo === 'revision'
          ? b.fechaRevision.getTime()
          : b.fechaVencimiento.getTime();

      return fechaB - fechaA;
    });
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
