import { peticion } from '../../core/http';

export interface ImagenPublicacion {
  id: number;
  publicationId: number;
  imageUrl: string;
  orderImage: number;
}

export interface Comentario {
  id: number;
  publicationId: number;
  userId: number;
  comment: string;
  user: string;
  username: string;
  profilePhoto: string;
  creationDate: string; // ISO 8601
}

export interface Publicacion {
  id: number;
  idUser: number;
  description: string;
  videoUrl: string | null;
  likes: number;
  coments: number; // así viene escrito en el backend
  user: string;
  username: string;
  profilePhoto: string;
  creationDate: string; // ISO 8601
  images: ImagenPublicacion[];
  commentsList: Comentario[];
  likedByCurrentUser: boolean;
}

export function obtenerPublicaciones(): Promise<Publicacion[]> {
  return peticion<Publicacion[]>('/publication');
}

export function obtenerPublicacionesPorUsuario(userId: number): Promise<Publicacion[]> {
  return peticion<Publicacion[]>(`/publication/user/${userId}`);
}

export function obtenerCantidadLikes(publicationId: number): Promise<number> {
  return peticion<number>(`/publication/${publicationId}/likes/count`);
}

export function obtenerEstadoMeGusta(publicationId: number, userId: number): Promise<boolean> {
  return peticion<boolean>(`/publication/${publicationId}/like/${userId}`);
}

export function darMeGusta(publicationId: number, userId: number): Promise<Publicacion> {
  return peticion<Publicacion>(`/publication/${publicationId}/like/${userId}`, {
    method: 'POST',
  });
}

export function quitarMeGusta(publicationId: number, userId: number): Promise<Publicacion> {
  return peticion<Publicacion>(`/publication/${publicationId}/like/${userId}`, {
    method: 'DELETE',
  });
}

export function obtenerImagenesPorPublicacion(
  publicationId: number
): Promise<ImagenPublicacion[]> {
  return peticion<ImagenPublicacion[]>(`/publication/${publicationId}/images`);
}

export function obtenerComentariosPorPublicacion(
  publicationId: number
): Promise<Comentario[]> {
  return peticion<Comentario[]>(`/publication/${publicationId}/comments`);
}

export function crearComentario(
  publicationId: number,
  userId: number,
  comment: string
): Promise<Comentario> {
  return peticion<Comentario>(`/publication/${publicationId}/comments/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

export function eliminarComentario(commentId: number, userId: number): Promise<Comentario> {
  return peticion<Comentario>(`/publication/comments/${commentId}/user/${userId}`, {
    method: 'DELETE',
  });
}

export function eliminarPublicacion(publicationId: number, userId: number): Promise<Publicacion> {
  return peticion<Publicacion>(`/publication/${publicationId}/user/${userId}`, {
    method: 'DELETE',
  });
}
