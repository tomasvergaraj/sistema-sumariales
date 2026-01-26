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
import { CicloFiscal, Prorroga, ProcesoSumarial, EtapaProceso } from '@/types';
import { diferenciaDiasHabiles } from '@/utils/diasHabiles';

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

    const hoy = new Date();
    const fechaNotificacion = cicloActivo.fecha_notificacion.toDate();

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

    if (diasHabilesTranscurridos >= 40 && !tieneProrroga2) {
      return 'INDAGATORIA_FUERA_PLAZO';
    }

    if (diasHabilesTranscurridos >= 20 && !tieneProrroga1) {
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
    data: { numero_resolucion: string; fecha_resolucion: Date }
  ) => {
    if (!procesoId || !cicloId) return;

    try {
      
      const cicloRef = doc(db, 'procesos_sumariales', procesoId, 'ciclos_fiscal', cicloId);
      const prorrogaData: Prorroga = {
        numero_resolucion: data.numero_resolucion,
        fecha_resolucion: Timestamp.fromDate(data.fecha_resolucion),
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

  return {
    ciclos,
    cicloActivo,
    ciclosAnteriores,
    loading,
    error,
    actualizarProrroga,
    eliminarProrroga,
  };
};
