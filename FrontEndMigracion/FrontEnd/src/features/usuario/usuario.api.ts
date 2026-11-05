export const API_BASE_URL = 'http://localhost:8081';

import { peticion } from '../../core/http';
import type { UserResponse } from '../auth/auth';

// Obtención del usuario por su id.
export function obtenerUsuarioPorId(id: number): Promise<UserResponse> {
  return peticion<UserResponse>(`/user/${id}`, {
    method: 'GET',
  });
}