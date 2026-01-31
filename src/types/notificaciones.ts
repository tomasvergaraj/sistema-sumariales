export type TipoNotificacion = 'revision' | 'plazo';

export interface NotificacionGlobalBase {
  id: string;
  tipo: TipoNotificacion;
  leida: boolean;
  fecha: Date;
  procesoId: string;
}

export interface NotificacionRevision extends NotificacionGlobalBase {
  tipo: 'revision';
  numeroResolucion: string;
  tipoRevision: string;
}

export interface NotificacionPlazo extends NotificacionGlobalBase {
  tipo: 'plazo';
  nombreProceso: string;
  nombrePlazo: string;
}

export type NotificacionGlobal =
  | NotificacionRevision
  | NotificacionPlazo;
