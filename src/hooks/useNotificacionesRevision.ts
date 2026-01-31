import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProcesoSumarial, CicloFiscal } from '@/types';
import { diferenciaDiasHabiles } from '@/utils/diasHabiles';

export interface NotificacionRevision {
  id: string;
  procesoId: string;
  numeroResolucion: string;
  tipoRevision: string;
  numeroMemo: string | null;
  fechaRevision: Date;
  leida: boolean;
}

export interface NotificacionPlazoVencido {
  id: string;
  procesoId: string;
  numeroResolucion: string;
  tipoPlazo: string;
  fechaVencimiento: Date;
  diasVencido: number;
  leida: boolean;
}

const STORAGE_KEY = 'notificaciones_leidas';
const STORAGE_KEY_PLAZOS = 'notificaciones_plazos_leidas';

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

// Obtener IDs de notificaciones de plazos leídas del localStorage
const getNotificacionesPlazoLeidas = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PLAZOS);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignorar errores de parsing
  }
  return new Set();
};

// Guardar IDs de notificaciones de plazos leídas en localStorage
const saveNotificacionesPlazoLeidas = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY_PLAZOS, JSON.stringify([...ids]));
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

// Hook para notificaciones de plazos vencidos (solo para administradores)
export const useNotificacionesPlazoVencido = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionPlazoVencido[]>([]);
  const [notificacionesLeidas, setNotificacionesLeidas] = useState<Set<string>>(getNotificacionesPlazoLeidas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar procesos activos
    const procesosRef = collection(db, 'procesos_sumariales');
    const q = query(
      procesosRef,
      where('activo', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const nuevasNotificaciones: NotificacionPlazoVencido[] = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        for (const docSnap of snapshot.docs) {
          const proceso = { id: docSnap.id, ...docSnap.data() } as ProcesoSumarial;

          // Obtener ciclo activo
          const ciclosRef = collection(db, 'procesos_sumariales', proceso.id!, 'ciclos_fiscal');
          const ciclosQuery = query(ciclosRef, where('activo', '==', true));
          const ciclosSnapshot = await getDocs(ciclosQuery);

          if (ciclosSnapshot.docs.length > 0) {
            const ciclo = { id: ciclosSnapshot.docs[0].id, ...ciclosSnapshot.docs[0].data() } as CicloFiscal;
            const tieneProrroga1 = !!ciclo.prorroga_1;
            const tieneProrroga2 = !!ciclo.prorroga_2;

            // Determinar el plazo activo y verificar si está vencido
            let plazoActivo: { tipo: string; termino: Date } | null = null;

            if (ciclo.plazos.plazo_20) {
              const termino20 = ciclo.plazos.plazo_20.termino.toDate();
              if (termino20 < hoy && !tieneProrroga1) {
                plazoActivo = { tipo: '20 días', termino: termino20 };
              }
            }

            if (!plazoActivo && ciclo.plazos.plazo_40 && tieneProrroga1) {
              const termino40 = ciclo.plazos.plazo_40.termino.toDate();
              if (termino40 < hoy && !tieneProrroga2) {
                plazoActivo = { tipo: '40 días', termino: termino40 };
              }
            }

            if (!plazoActivo && ciclo.plazos.plazo_60 && tieneProrroga2) {
              const termino60 = ciclo.plazos.plazo_60.termino.toDate();
              if (termino60 < hoy) {
                plazoActivo = { tipo: '60 días', termino: termino60 };
              }
            }

            if (plazoActivo) {
              const diasVencido = diferenciaDiasHabiles(plazoActivo.termino, hoy);
              const notifId = `plazo_${proceso.id}_${plazoActivo.tipo}`;

              nuevasNotificaciones.push({
                id: notifId,
                procesoId: proceso.id!,
                numeroResolucion: proceso.numero_resolucion,
                tipoPlazo: plazoActivo.tipo,
                fechaVencimiento: plazoActivo.termino,
                diasVencido,
                leida: notificacionesLeidas.has(notifId),
              });
            }
          }
        }

        // Ordenar por días vencido descendente
        nuevasNotificaciones.sort((a, b) => b.diasVencido - a.diasVencido);

        setNotificaciones(nuevasNotificaciones);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar notificaciones de plazos:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [notificacionesLeidas]);

  const marcarComoLeida = useCallback((id: string) => {
    setNotificacionesLeidas((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      saveNotificacionesPlazoLeidas(updated);
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
      saveNotificacionesPlazoLeidas(updated);
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
