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

