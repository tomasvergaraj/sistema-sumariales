import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProcesoSumarial, CicloFiscal, EtapaProceso } from '@/types';
import { addDiasHabiles } from '@/utils/diasHabiles';

export const useProcesos = () => {
  const [procesos, setProcesos] = useState<ProcesoSumarial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'procesos_sumariales'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const procesosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProcesoSumarial[];

        setProcesos(procesosData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [refreshTrigger]);

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const actualizarEtapasAutomaticas = async () => {
    try {
      const procesosSnapshot = await getDocs(query(
        collection(db, 'procesos_sumariales'),
        orderBy('createdAt', 'desc')
      ));

      for (const procesoDoc of procesosSnapshot.docs) {
        const proceso = { id: procesoDoc.id, ...procesoDoc.data() } as ProcesoSumarial;

        // Obtener ciclo activo para determinar etapa
        const ciclosRef = collection(db, 'procesos_sumariales', proceso.id!, 'ciclos_fiscal');
        const ciclosSnapshot = await getDocs(query(ciclosRef, where('activo', '==', true)));
        const cicloActivo = ciclosSnapshot.docs.length > 0 ? {
          id: ciclosSnapshot.docs[0].id,
          ...ciclosSnapshot.docs[0].data()
        } as CicloFiscal : undefined;

        const etapaCalculada = determinarEtapaAutomatica(proceso, cicloActivo);

        // Si la etapa calculada es diferente a la actual, actualizar
        if (proceso.etapa !== etapaCalculada) {
          await updateDoc(doc(db, 'procesos_sumariales', proceso.id!), {
            etapa: etapaCalculada,
            updatedAt: Timestamp.now(),
          });
        }
      }

      // Forzar refresh del estado
      forceRefresh();
    } catch (error) {
      console.error('Error actualizando etapas automáticas:', error);
    }
  };

  const crearProceso = async (data: Omit<ProcesoSumarial, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = Timestamp.now();
      const procesoRef = await addDoc(collection(db, 'procesos_sumariales'), {
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // Crear el primer ciclo de fiscal
      const fechaNotificacion = data.fecha_notificacion;
      const fechaNotificacionDate = fechaNotificacion.toDate();

      const cicloData: Omit<CicloFiscal, 'id'> = {
        fiscal: data.fiscal_actual.nombre,
        fecha_inicio: fechaNotificacion,
        fecha_notificacion: fechaNotificacion,
        motivo_cambio: null,
        plazos: {
          plazo_20: {
            inicio: fechaNotificacion,
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacionDate, 20)),
          },
          plazo_40: {
            inicio: Timestamp.fromDate(addDiasHabiles(fechaNotificacionDate, 20)),
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacionDate, 40)),
          },
          plazo_60: {
            inicio: Timestamp.fromDate(addDiasHabiles(fechaNotificacionDate, 40)),
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacionDate, 60)),
          },
        },
        activo: true,
        createdAt: now,
      };

      await addDoc(
        collection(db, 'procesos_sumariales', procesoRef.id, 'ciclos_fiscal'),
        cicloData
      );

      return procesoRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const actualizarProceso = async (id: string, data: Partial<ProcesoSumarial>) => {
    try {
      const procesoRef = doc(db, 'procesos_sumariales', id);
      await updateDoc(procesoRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cambiarFiscal = async (
    procesoId: string,
    nuevoFiscal: string,
    motivoCambio: string,
    fechaAsignacion: Date,
    fechaNotificacion: Date
  ) => {
    try {
      // Desactivar el ciclo actual
      const ciclosRef = collection(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal');
      const ciclosActivos = await getDocs(query(ciclosRef, where('activo', '==', true)));

      for (const cicloDoc of ciclosActivos.docs) {
        await updateDoc(doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloDoc.id), {
          activo: false,
        });
      }

      // Crear nuevo ciclo - los plazos se calculan desde la fecha de notificación
      const fechaInicioTimestamp = Timestamp.fromDate(fechaAsignacion);
      const fechaNotificacionTimestamp = Timestamp.fromDate(fechaNotificacion);
      const cicloData: Omit<CicloFiscal, 'id'> = {
        fiscal: nuevoFiscal,
        fecha_inicio: fechaInicioTimestamp,
        fecha_notificacion: fechaNotificacionTimestamp,
        motivo_cambio: motivoCambio,
        plazos: {
          plazo_20: {
            inicio: fechaNotificacionTimestamp,
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacion, 20)),
          },
          plazo_40: {
            inicio: Timestamp.fromDate(addDiasHabiles(fechaNotificacion, 20)),
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacion, 40)),
          },
          plazo_60: {
            inicio: Timestamp.fromDate(addDiasHabiles(fechaNotificacion, 40)),
            termino: Timestamp.fromDate(addDiasHabiles(fechaNotificacion, 60)),
          },
        },
        activo: true,
        createdAt: Timestamp.now(),
      };

      await addDoc(ciclosRef, cicloData);

      // Actualizar fiscal actual en el proceso
      const procesoRef = doc(db, 'procesos_sumariales', procesoId);
      await updateDoc(procesoRef, {
        fiscal_actual: {
          nombre: nuevoFiscal,
          fecha_asignacion: fechaInicioTimestamp,
        },
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const determinarEtapaAutomatica = (
    proceso: ProcesoSumarial,
    cicloActivo?: CicloFiscal
  ): EtapaProceso => {

    if (proceso.resolucion_final) {
      return 'CONCLUIDO';
    }

    if (!cicloActivo || !cicloActivo.fecha_notificacion) {
      return 'INDAGATORIA_VIGENTE';
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const termino20 = cicloActivo.plazos.plazo_20?.termino?.toDate();
    const termino40 = cicloActivo.plazos.plazo_40?.termino?.toDate();
    const termino60 = cicloActivo.plazos.plazo_60?.termino?.toDate();

    if (!termino20) {
      return 'INDAGATORIA_VIGENTE';
}

    termino20.setHours(0, 0, 0, 0);
    termino40?.setHours(0, 0, 0, 0);
    termino60?.setHours(0, 0, 0, 0);

    const tieneProrroga1 = !!cicloActivo.prorroga_1;
    const tieneProrroga2 = !!cicloActivo.prorroga_2;

    /**
     * SIN PRÓRROGAS
     * plazo máximo: 20 días
     */
    if (!tieneProrroga1 && hoy > termino20) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    /**
     * SOLO PRÓRROGA 1
     * plazo máximo: 40 días
     */
    if (
      tieneProrroga1 &&
      !tieneProrroga2 &&
      termino40 &&
      hoy > termino40
    ) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    /**
     * PRÓRROGA 1 + 2
     * plazo máximo: 60 días
     */
    if (
      tieneProrroga2 &&
      termino60 &&
      hoy > termino60
    ) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    return 'INDAGATORIA_VIGENTE';
  };


  return {
    procesos,
    loading,
    error,
    crearProceso,
    actualizarProceso,
    cambiarFiscal,
    determinarEtapaAutomatica,
    actualizarEtapasAutomaticas,
    forceRefresh,
  };
};
