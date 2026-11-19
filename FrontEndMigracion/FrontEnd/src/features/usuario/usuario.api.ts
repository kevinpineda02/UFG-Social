export { API_BASE_URL } from '../../core/api/api';
import { peticion } from '../../core/http';
import type { UserResponse } from '../auth/auth';

export type UserUpdateRequest = UserResponse;

// Obtención del usuario por su id.
export function obtenerUsuarioPorId(id: number): Promise<UserResponse> {
  return peticion<UserResponse>(`/user/${id}`, {
    method: 'GET',
  });
}

export function obtenerUsuarios(): Promise<UserResponse[]> {
  return peticion<UserResponse[]>('/user/users', {
    method: 'GET',
  });
}

export function editarUsuario(id: number, usuario: UserUpdateRequest): Promise<UserResponse> {
  return peticion<UserResponse>(`/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(usuario),
  });
}

export function actualizarFotoPerfil(id: number, archivo: File): Promise<UserResponse> {
  const datos = new FormData();
  datos.append('file', archivo);

  return peticion<UserResponse>(`/user/${id}/profile-photo`, {
    method: 'PATCH',
    body: datos,
  });
}