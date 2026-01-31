import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'viewer' | 'juridica';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
}

export type EtapaProceso =
  | 'INDAGATORIA_VIGENTE'
  | 'INDAGATORIA_FUERA_PLAZO'
  | 'CONCLUIDO';

export interface Plazo {
  inicio: Timestamp;
  termino: Timestamp;
}

export interface Prorroga {
  numero_resolucion: string;
  fecha_resolucion: Timestamp;
}

export interface Ordinario {
  numero_ordinario: string;
  fecha_ingreso: Timestamp;
  fecha_notificacion?: Timestamp | null;
}

export type TipoResultado = 'medida_disciplinaria' | 'sobreseimiento' | 'absolucion' | null;

export type TipoRevisionJuridica = 'reapertura' | 'acoge_propuesta_fiscal' | 'pendiente_de_revision' | null;

export interface RevisionJuridica {
  revision_realizada: boolean;
  tipo_revision: TipoRevisionJuridica;
  numero_memo: string | null;
  fecha_revision: Timestamp | null;
}

export interface Plazos {
  plazo_20: Plazo;
  plazo_40: Plazo | null;
  plazo_60: Plazo | null;
}

export interface FiscalActual {
  nombre: string;
  fecha_asignacion: Timestamp;
}

export interface CicloFiscal {
  id?: string;
  fiscal: string;
  fecha_inicio: Timestamp;
  fecha_notificacion: Timestamp;
  motivo_cambio: string | null;
  plazos: Plazos;
  prorroga_1?: Prorroga | null;
  prorroga_2?: Prorroga | null;
  ordinario_20?: Ordinario | null;
  ordinario_40?: Ordinario | null;
  ordinario_60?: Ordinario | null;
  activo: boolean;
  createdAt: Timestamp;
}

export interface Recusacion {
  id?: string;
  fiscal: string;
  fecha: Timestamp;
  ha_lugar: boolean;
  causal_invocada: string;
  observacion: string;
  createdAt: Timestamp;
}

export interface ProcesoSumarial {
  id?: string;
  sirh: boolean;
  envio_ordinario: boolean;
  tipo_proceso: string;
  numero_resolucion: string;
  fecha_resolucion: Timestamp;
  por_cgr: boolean;
  detalle: string;
  etapa: EtapaProceso;
  fecha_notificacion: Timestamp;
  fiscal_actual: FiscalActual;
  activo: boolean;
  resolucion_final: string | null;
  tipo_resultado: TipoResultado;
  detalle_resultado: string | null;
  funcionario: string | null;
  enviado_cgr: boolean;
  memo_entrega_direccion: string | null;
  revision_juridica?: RevisionJuridica | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type EstadoPlazo = 'vigente' | 'por-vencer' | 'vencido';

export interface DashboardStats {
  total_procesos: number;
  procesos_activos: number;
  por_etapa: Record<EtapaProceso, number>;
  plazos_vigentes: number;
  plazos_por_vencer: number;
  plazos_vencidos: number;
}
