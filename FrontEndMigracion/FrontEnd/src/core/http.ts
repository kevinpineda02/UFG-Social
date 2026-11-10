import { obtenerToken, cerrarSesion } from '../features/auth/authGuard';
import { API_BASE_URL } from './api/api';

export async function peticion<T>(
  ruta: string,
  opciones: RequestInit = {}
): Promise<T> {
  const token = obtenerToken();

  const res = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  if (res.status === 401) {
    cerrarSesion();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const cuerpo = await res.text();
  return cuerpo ? (JSON.parse(cuerpo) as T) : (undefined as T);
}
