import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { CicloFiscal, Prorroga, Ordinario, ProcesoSumarial, EtapaProceso } from '@/types';
import { diferenciaDiasHabiles } from '@/utils/diasHabiles';
import { validarFechaProrroga } from '@/hooks/usePlazos';

export const useCiclosFiscal = (procesoId: string | undefined, onProcesoUpdated?: () => void) => {
  const [ciclos, setCiclos] = useState<CicloFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!procesoId) {
      setLoading(false);
      return;
    }

    const ciclosRef = collection(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal');
    const q = query(ciclosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ciclosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CicloFiscal[];
        setCiclos(ciclosData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [procesoId]);

  const cicloActivo = ciclos.find(c => c.activo);
  const ciclosAnteriores = ciclos.filter(c => !c.activo);

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

  const actualizarEtapaProceso = useCallback(async () => {
    if (!procesoId) return;

    try {
      
      // Obtener el proceso actual
      const procesoRef = doc(db, 'procesos_sumariales', procesoId);
      const procesoSnap = await getDoc(procesoRef);
      
      if (!procesoSnap.exists()) {
        return;
      }
      
      const proceso = { id: procesoSnap.id, ...procesoSnap.data() } as ProcesoSumarial;
      
      // Obtener el ciclo activo actualizado directamente de Firestore
      const ciclosRef = collection(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal');
      const ciclosSnapshot = await getDocs(query(ciclosRef, where('activo', '==', true)));
      const cicloActivoActualizado = ciclosSnapshot.docs.length > 0 ? {
        id: ciclosSnapshot.docs[0].id,
        ...ciclosSnapshot.docs[0].data()
      } as CicloFiscal : undefined;
      
      // Calcular la nueva etapa
      const nuevaEtapa = determinarEtapaAutomatica(proceso, cicloActivoActualizado);
      
      // Si la etapa cambió, actualizar
      if (proceso.etapa !== nuevaEtapa) {
        await updateDoc(procesoRef, {
          etapa: nuevaEtapa,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('❌ Error al actualizar etapa del proceso:', error);
    }
  }, [procesoId]);

  const actualizarProrroga = useCallback(async (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2',
    data: { numero_resolucion: string; fecha_resolucion: Date; fecha_solicitud: Date }
  ) => {
    if (!procesoId || !cicloId) return;

    try {
      // Obtener el ciclo actual para validar la fecha
      const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloId);
      const cicloSnap = await getDoc(cicloRef);

      if (!cicloSnap.exists()) {
        throw new Error('El ciclo fiscal no existe');
      }

      const cicloData = cicloSnap.data() as CicloFiscal;
      const fechaNotificacion = cicloData.fecha_notificacion.toDate();

      // Validar que la prórroga se solicitó dentro del plazo correspondiente
      // - prorroga_1: días 0-20 hábiles desde notificación
      // - prorroga_2: días 20-40 hábiles desde notificación (período de la primera prórroga)
      const validacion = validarFechaProrroga(fechaNotificacion, data.fecha_solicitud, tipoProrroga);
      if (!validacion.valido) {
        throw new Error(validacion.mensaje);
      }

      const prorrogaData: Prorroga = {
        numero_resolucion: data.numero_resolucion,
        fecha_resolucion: Timestamp.fromDate(data.fecha_resolucion),
        fecha_solicitud: Timestamp.fromDate(data.fecha_solicitud),
      };

      await updateDoc(cicloRef, {
        [tipoProrroga]: prorrogaData,
      });

      // Actualizar la etapa del proceso después de modificar la prórroga
      await actualizarEtapaProceso();

      // Notificar que el proceso se actualizó
      if (onProcesoUpdated) {
        onProcesoUpdated();
      }
    } catch (err: any) {
      console.error('❌ Error al actualizar prórroga:', err);
      setError(err.message);
      throw err;
    }
  }, [procesoId, actualizarEtapaProceso, onProcesoUpdated]);

  const eliminarProrroga = useCallback(async (
    cicloId: string,
    tipoProrroga: 'prorroga_1' | 'prorroga_2'
  ) => {
    if (!procesoId || !cicloId) return;

    try {
      
      const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloId);

      await updateDoc(cicloRef, {
        [tipoProrroga]: null,
      });

      // Actualizar la etapa del proceso después de eliminar la prórroga
      await actualizarEtapaProceso();
      
      // Notificar que el proceso se actualizó
      if (onProcesoUpdated) {
        onProcesoUpdated();
      }
    } catch (err: any) {
      console.error('❌ Error al eliminar prórroga:', err);
      setError(err.message);
      throw err;
    }
  }, [procesoId, actualizarEtapaProceso, onProcesoUpdated]);

  const actualizarOrdinario = useCallback(async (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60',
    data: { numero_ordinario: string; fecha_ingreso: Date; fecha_notificacion?: Date | null }
  ) => {
    if (!procesoId || !cicloId) return;

    try {
      const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloId);
      const ordinarioData: Ordinario = {
        numero_ordinario: data.numero_ordinario,
        fecha_ingreso: Timestamp.fromDate(data.fecha_ingreso),
        fecha_notificacion: data.fecha_notificacion ? Timestamp.fromDate(data.fecha_notificacion) : null,
      };

      await updateDoc(cicloRef, {
        [tipoOrdinario]: ordinarioData,
      });

      if (onProcesoUpdated) {
        onProcesoUpdated();
      }
    } catch (err: any) {
      console.error('Error al actualizar ordinario:', err);
      setError(err.message);
      throw err;
    }
  }, [procesoId, onProcesoUpdated]);

  const eliminarOrdinario = useCallback(async (
    cicloId: string,
    tipoOrdinario: 'ordinario_20' | 'ordinario_40' | 'ordinario_60'
  ) => {
    if (!procesoId || !cicloId) return;

    try {
      const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloId);

      await updateDoc(cicloRef, {
        [tipoOrdinario]: null,
      });

      if (onProcesoUpdated) {
        onProcesoUpdated();
      }
    } catch (err: any) {
      console.error('Error al eliminar ordinario:', err);
      setError(err.message);
      throw err;
    }
  }, [procesoId, onProcesoUpdated]);

  return {
    ciclos,
    cicloActivo,
    ciclosAnteriores,
    loading,
    error,
    actualizarProrroga,
    eliminarProrroga,
    actualizarOrdinario,
    eliminarOrdinario,
  };
};
