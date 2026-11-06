import { obtenerToken } from '../../features/auth/authGuard';
import { API_BASE_URL } from '../../core/api/api';

export async function crearPublicacion(
  userId: number,
  descripcion: string,
  imagenes: File[],
  video: File | null
): Promise<void> {
  const formulario = new FormData();
  formulario.append('description', descripcion);
  imagenes.forEach((imagen) => formulario.append('files', imagen));
  if (video) {
    formulario.append('videoFile', video);
  }

  const token = obtenerToken();
  const respuesta = await fetch(`${API_BASE_URL}/publication/${userId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formulario,
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo crear la publicación (${respuesta.status})`);
  }
}