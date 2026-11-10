import { peticion } from '../../core/http';

export interface SolicitudSeguimiento {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterUsername: string;
  requesterProfilePhoto: string;
  receiverId: number;
  receiverName: string;
  receiverUsername: string;
  receiverProfilePhoto: string;
  status: string;
  creationDate: string;
}

export interface EstadoSeguimiento {
  requesterId: number;
  targetUserId: number;
  status: string;
}

export function enviarSolicitud(requesterId: number, receiverId: number): Promise<SolicitudSeguimiento> {
  return peticion<SolicitudSeguimiento>(`/follow/request/${requesterId}/${receiverId}`, { method: 'POST' });
}

export function cancelarSolicitud(requesterId: number, receiverId: number): Promise<void> {
  return peticion<void>(`/follow/request/${requesterId}/${receiverId}`, { method: 'DELETE' });
}

export function obtenerEstadoSeguimiento(requesterId: number, targetUserId: number): Promise<EstadoSeguimiento> {
  return peticion<EstadoSeguimiento>(`/follow/status/${requesterId}/${targetUserId}`);
}

export function obtenerSolicitudesPendientes(userId: number): Promise<SolicitudSeguimiento[]> {
  return peticion<SolicitudSeguimiento[]>(`/follow/requests/pending/${userId}`);
}

export function aceptarSolicitud(requestId: number): Promise<SolicitudSeguimiento> {
  return peticion<SolicitudSeguimiento>(`/follow/request/${requestId}/accept`, { method: 'POST' });
}

export function rechazarSolicitud(requestId: number): Promise<SolicitudSeguimiento> {
  return peticion<SolicitudSeguimiento>(`/follow/request/${requestId}/reject`, { method: 'POST' });
}