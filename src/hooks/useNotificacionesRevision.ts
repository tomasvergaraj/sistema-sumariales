import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProcesoSumarial } from '@/types';

export interface NotificacionRevision {
  id: string;
  procesoId: string;
  numeroResolucion: string;
  tipoRevision: string;
  numeroMemo: string | null;
  fechaRevision: Date;
  leida: boolean;
}

const STORAGE_KEY = 'notificaciones_leidas';

// Obtener IDs de notificaciones leídas del localStorage
const getNotificacionesLeidas = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignorar errores de parsing
  }
  return new Set();
};

// Guardar IDs de notificaciones leídas en localStorage
const saveNotificacionesLeidas = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignorar errores de storage
  }
};

export const useNotificacionesRevision = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionRevision[]>([]);
  const [notificacionesLeidas, setNotificacionesLeidas] = useState<Set<string>>(getNotificacionesLeidas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar procesos con revisión jurídica realizada
    const procesosRef = collection(db, 'procesos_sumariales');
    const q = query(
      procesosRef,
      where('revision_juridica.revision_realizada', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const hace48Horas = new Date();
        hace48Horas.setHours(hace48Horas.getHours() - 48);

        const nuevasNotificaciones: NotificacionRevision[] = [];

        snapshot.docs.forEach((doc) => {
          const proceso = { id: doc.id, ...doc.data() } as ProcesoSumarial;

          if (proceso.revision_juridica?.fecha_revision) {
            const fechaRevision = proceso.revision_juridica.fecha_revision.toDate();

            // Filtrar solo las de las últimas 48 horas
            if (fechaRevision >= hace48Horas) {
              const notifId = `${proceso.id}_${fechaRevision.getTime()}`;

              nuevasNotificaciones.push({
                id: notifId,
                procesoId: proceso.id!,
                numeroResolucion: proceso.numero_resolucion,
                tipoRevision: proceso.revision_juridica.tipo_revision === 'reapertura'
                  ? 'Reapertura'
                  : proceso.revision_juridica.tipo_revision === 'acoge_propuesta_fiscal'
                    ? 'Acoge Propuesta del Fiscal'
                    : proceso.revision_juridica.tipo_revision === 'pendiente_de_revision'
                      ? 'Pendiente de Revisión'
                      : 'Revisión Jurídica',
                numeroMemo: proceso.revision_juridica.numero_memo,
                fechaRevision: fechaRevision,
                leida: notificacionesLeidas.has(notifId),
              });
            }
          }
        });

        // Ordenar por fecha descendente
        nuevasNotificaciones.sort((a, b) => b.fechaRevision.getTime() - a.fechaRevision.getTime());

        setNotificaciones(nuevasNotificaciones);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar notificaciones:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [notificacionesLeidas]);

  const marcarComoLeida = useCallback((id: string) => {
    setNotificacionesLeidas((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      saveNotificacionesLeidas(updated);
      return updated;
    });

    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    const allIds = new Set(notificaciones.map((n) => n.id));
    setNotificacionesLeidas((prev) => {
      const updated = new Set([...prev, ...allIds]);
      saveNotificacionesLeidas(updated);
      return updated;
    });

    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, [notificaciones]);

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leida);
  const cantidadNoLeidas = notificacionesNoLeidas.length;

  return {
    notificaciones,
    notificacionesNoLeidas,
    cantidadNoLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
  };
};
