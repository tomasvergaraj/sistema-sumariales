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
import { addDiasHabiles, diferenciaDiasHabiles } from '@/utils/diasHabiles';

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

  const determinarEtapaAutomatica = (proceso: ProcesoSumarial, cicloActivo?: CicloFiscal): EtapaProceso => {
    // Si hay resolución final, está concluido
    if (proceso.resolucion_final) {
      return 'CONCLUIDO';
    }

    // Si no hay ciclo activo o no hay fecha de notificación, por defecto indagatoria vigente
    if (!cicloActivo || !cicloActivo.fecha_notificacion) {
      return 'INDAGATORIA_VIGENTE';
    }

    // Normalizar fechas al inicio del día para evitar que la hora actual afecte el cálculo
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaNotificacion = cicloActivo.fecha_notificacion.toDate();
    fechaNotificacion.setHours(0, 0, 0, 0);

    // Calcular días hábiles transcurridos desde la notificación
    const diasHabilesTranscurridos = diferenciaDiasHabiles(fechaNotificacion, hoy);

    // Verificar prórrogas y plazos
    const tieneProrroga1 = cicloActivo.prorroga_1 !== null && cicloActivo.prorroga_1 !== undefined;
    const tieneProrroga2 = cicloActivo.prorroga_2 !== null && cicloActivo.prorroga_2 !== undefined;

    // Lógica de plazos con prórrogas:
    // - 0-20 días hábiles: siempre vigente (plazo inicial)
    // - 20-40 días hábiles: vigente solo con prórroga 1
    // - 40-60 días hábiles: vigente solo con prórroga 2
    // - >60 días hábiles: siempre fuera de plazo

    if (diasHabilesTranscurridos > 60) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    if (diasHabilesTranscurridos > 40 && !tieneProrroga2) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    if (diasHabilesTranscurridos > 20 && !tieneProrroga1) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    // Si está dentro de los plazos con las prórrogas correspondientes, está vigente
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
