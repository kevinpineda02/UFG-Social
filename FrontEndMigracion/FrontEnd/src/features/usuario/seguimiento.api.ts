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

export interface RelacionSeguimiento {
  id: number;
  followerId: number;
  followerName: string;
  followerUsername: string;
  followerProfilePhoto: string;
  followedId: number;
  followedName: string;
  followedUsername: string;
  followedProfilePhoto: string;
  creationDate: string;
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

export function obtenerCantidadSeguidores(userId: number): Promise<number> {
  return peticion<number>(`/follow/followers/${userId}/count`);
}

export function obtenerCantidadSeguidos(userId: number): Promise<number> {
  return peticion<number>(`/follow/following/${userId}/count`);
}

export function obtenerSeguidores(userId: number): Promise<RelacionSeguimiento[]> {
  return peticion<RelacionSeguimiento[]>(`/follow/followers/${userId}`);
}

export function obtenerSeguidos(userId: number): Promise<RelacionSeguimiento[]> {
  return peticion<RelacionSeguimiento[]>(`/follow/following/${userId}`);
}

export function eliminarSeguimiento(followerId: number, followedId: number): Promise<void> {
  return peticion<void>(`/follow/${followerId}/${followedId}`, { method: 'DELETE' });
}