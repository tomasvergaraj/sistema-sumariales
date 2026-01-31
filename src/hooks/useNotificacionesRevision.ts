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

/* =========================
   TIPOS
========================= */

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
  nombreProceso: string;
  nombrePlazo: string;
  fechaVencimiento: Date;
  diasVencido: number;
  leida: boolean;
}

/* =========================
   STORAGE
========================= */

const STORAGE_KEY = 'notificaciones_leidas';
const STORAGE_KEY_PLAZOS = 'notificaciones_plazos_leidas';

const getFromStorage = (key: string): Set<string> => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveToStorage = (key: string, ids: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {}
};

/* =========================
   REVISION JURIDICA
========================= */

export const useNotificacionesRevision = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionRevision[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(
    getFromStorage(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'procesos_sumariales'),
      where('revision_juridica.revision_realizada', '==', true)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const hace48Horas = new Date();
      hace48Horas.setHours(hace48Horas.getHours() - 48);

      const data: NotificacionRevision[] = [];

      snapshot.forEach(doc => {
        const proceso = { id: doc.id, ...doc.data() } as ProcesoSumarial;
        const rev = proceso.revision_juridica;

        if (!rev?.fecha_revision) return;

        const fechaRevision = rev.fecha_revision.toDate();
        if (fechaRevision < hace48Horas) return;

        const id = `${proceso.id}_${fechaRevision.getTime()}`;

        data.push({
          id,
          procesoId: proceso.id!,
          numeroResolucion: proceso.numero_resolucion,
          tipoRevision:
            rev.tipo_revision === 'reapertura'
              ? 'Reapertura'
              : rev.tipo_revision === 'acoge_propuesta_fiscal'
              ? 'Acoge Propuesta del Fiscal'
              : 'Revisión Jurídica',
          numeroMemo: rev.numero_memo ?? null,
          fechaRevision,
          leida: leidas.has(id),
        });
      });

      data.sort((a, b) => b.fechaRevision.getTime() - a.fechaRevision.getTime());
      setNotificaciones(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [leidas]);

  const marcarComoLeida = useCallback((id: string) => {
    setLeidas(prev => {
      const next = new Set(prev).add(id);
      saveToStorage(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    const all = new Set(notificaciones.map(n => n.id));
    saveToStorage(STORAGE_KEY, all);
    setLeidas(all);
    setNotificaciones(n => n.map(x => ({ ...x, leida: true })));
  }, [notificaciones]);

  return {
    notificaciones,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
  };
};

/* =========================
   PLAZOS VENCIDOS
========================= */

export const useNotificacionesPlazoVencido = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionPlazoVencido[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(
    getFromStorage(STORAGE_KEY_PLAZOS)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'procesos_sumariales'),
      where('activo', '==', true)
    );

    const unsubscribe = onSnapshot(q, async snapshot => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const data: NotificacionPlazoVencido[] = [];

      for (const doc of snapshot.docs) {
        const proceso = { id: doc.id, ...doc.data() } as ProcesoSumarial;

        const ciclosSnap = await getDocs(
          query(
            collection(db, 'procesos_sumariales', proceso.id!, 'ciclos_fiscal'),
            where('activo', '==', true)
          )
        );

        if (ciclosSnap.empty) continue;

        const ciclo = ciclosSnap.docs[0].data() as CicloFiscal;

        const plazos = ciclo.plazos;
        if (!plazos) continue;

        const evaluarPlazo = (
          plazo: any | null,
          _nombre: string,
          habilitado: boolean
        ) => {
          if (!plazo || !habilitado) return null;
          const termino = plazo.termino.toDate();
          return termino < hoy ? termino : null;
        };

        const termino =
          evaluarPlazo(plazos.plazo_20, '20 días', !ciclo.prorroga_1) ??
          evaluarPlazo(plazos.plazo_40, '40 días', !!ciclo.prorroga_1 && !ciclo.prorroga_2) ??
          evaluarPlazo(plazos.plazo_60, '60 días', !!ciclo.prorroga_2);

        if (!termino) continue;

        const diasVencido = diferenciaDiasHabiles(termino, hoy);
        const id = `plazo_${proceso.id}_${termino.getTime()}`;

        data.push({
          id,
          procesoId: proceso.id!,
          numeroResolucion: proceso.numero_resolucion,
          nombreProceso: proceso.tipo_proceso ?? proceso.numero_resolucion,
          nombrePlazo: diasVencido === 0 ? 'Plazo vencido hoy' : 'Plazo vencido',
          fechaVencimiento: termino,
          diasVencido,
          leida: leidas.has(id),
        });
      }

      data.sort((a, b) => b.diasVencido - a.diasVencido);
      setNotificaciones(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [leidas]);

  const marcarComoLeida = useCallback((id: string) => {
    setLeidas(prev => {
      const next = new Set(prev).add(id);
      saveToStorage(STORAGE_KEY_PLAZOS, next);
      return next;
    });
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    const all = new Set(notificaciones.map(n => n.id));
    saveToStorage(STORAGE_KEY_PLAZOS, all);
    setLeidas(all);
    setNotificaciones(n => n.map(x => ({ ...x, leida: true })));
  }, [notificaciones]);

  return {
    notificaciones,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
  };
};
