import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerUserId } from '../features/auth/authGuard';
import type { UserResponse } from '../features/auth/auth';
import {
  aceptarSolicitud,
  cancelarSolicitud,
  enviarSolicitud,
  obtenerEstadoSeguimiento,
  obtenerSolicitudesPendientes,
  rechazarSolicitud,
  type SolicitudSeguimiento,
} from '../features/usuario/seguimiento.api';
import { obtenerUsuarios } from '../features/usuario/usuario.api';

const solicitudesDiv = document.querySelector<HTMLDivElement>('.solicitudes');

function resolverFoto(url: string | null | undefined): string {
  if (!url) return fotoPorDefecto;
  return url.startsWith('http') || url.startsWith('data:')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function crearFoto(url: string | null | undefined, nombre: string): HTMLImageElement {
  const foto = document.createElement('img');
  foto.className = 'foto-perfil-sugerencias';
  foto.src = resolverFoto(url);
  foto.alt = `Foto de ${nombre}`;
  foto.onerror = () => {
    foto.onerror = null;
    foto.src = fotoPorDefecto;
  };
  return foto;
}

function nombreUsuario(usuario: UserResponse): string {
  return usuario.username?.trim() || usuario.name?.trim() || 'Usuario';
}

function crearBotonSeguir(usuarioActualId: number, usuario: UserResponse, estado: string): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-seguir-sugerencias';
  let estadoActual = estado;
  const actualizarTexto = (): void => {
    boton.textContent = estadoActual === 'FOLLOWING'
    ? 'Siguiendo'
    : estadoActual === 'PENDING_SENT'
      ? 'Solicitud enviada'
      : estadoActual === 'ERROR'
        ? 'No disponible'
        : 'Seguir';
    boton.disabled = estadoActual === 'FOLLOWING' || estadoActual === 'ERROR';
  };
  actualizarTexto();
  boton.addEventListener('click', async () => {
    const estabaPendiente = estadoActual === 'PENDING_SENT';
    boton.disabled = true;
    try {
      if (estabaPendiente) {
        await cancelarSolicitud(usuarioActualId, usuario.id);
        estadoActual = 'NONE';
      } else {
        await enviarSolicitud(usuarioActualId, usuario.id);
        estadoActual = 'PENDING_SENT';
      }
      actualizarTexto();
    } catch (error) {
      console.error(
        estabaPendiente
          ? 'No se pudo cancelar la solicitud de seguimiento:'
          : 'No se pudo enviar la solicitud de seguimiento:',
        error
      );
      if (estabaPendiente) {
        estadoActual = 'NONE';
        actualizarTexto();
      } else {
        actualizarTexto();
      }
    }
  });
  return boton;
}

function crearTarjetaSugerencia(usuario: UserResponse, usuarioActualId: number, estado: string): HTMLElement {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'contenedor-sugerencia';
  tarjeta.appendChild(crearFoto(usuario.profilePhoto, nombreUsuario(usuario)));

  const informacion = document.createElement('div');
  informacion.className = 'informacion-usuario-sugerencias';
  const nombre = document.createElement('strong');
  nombre.className = 'nombre-usuario-sugerencias';
  nombre.textContent = usuario.name || nombreUsuario(usuario);
  const username = document.createElement('span');
  username.className = 'username-sugerencias';
  username.textContent = `@${nombreUsuario(usuario)}`;
  informacion.append(nombre, username, crearBotonSeguir(usuarioActualId, usuario, estado));
  tarjeta.appendChild(informacion);
  return tarjeta;
}

function crearTarjetaSolicitud(
  solicitud: SolicitudSeguimiento,
  actualizar: () => void
): HTMLElement {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta-solicitud';
  tarjeta.appendChild(crearFoto(solicitud.requesterProfilePhoto, solicitud.requesterName));

  const informacion = document.createElement('div');
  informacion.className = 'informacion-solicitud';
  const nombre = document.createElement('strong');
  nombre.textContent = solicitud.requesterName || solicitud.requesterUsername;
  const username = document.createElement('span');
  username.textContent = `@${solicitud.requesterUsername}`;
  const acciones = document.createElement('div');
  acciones.className = 'acciones-solicitud';

  const aceptar = document.createElement('button');
  aceptar.type = 'button';
  aceptar.className = 'boton-aceptar';
  aceptar.textContent = 'Aceptar';
  const rechazar = document.createElement('button');
  rechazar.type = 'button';
  rechazar.className = 'boton-rechazar';
  rechazar.textContent = 'Rechazar';
  aceptar.addEventListener('click', async () => {
    aceptar.disabled = true;
    rechazar.disabled = true;
    try {
      await aceptarSolicitud(solicitud.id);
      actualizar();
    } catch (error) {
      console.error('No se pudo aceptar la solicitud:', error);
      aceptar.disabled = false;
      rechazar.disabled = false;
    }
  });
  rechazar.addEventListener('click', async () => {
    aceptar.disabled = true;
    rechazar.disabled = true;
    try {
      await rechazarSolicitud(solicitud.id);
      actualizar();
    } catch (error) {
      console.error('No se pudo rechazar la solicitud:', error);
      aceptar.disabled = false;
      rechazar.disabled = false;
    }
  });

  acciones.append(aceptar, rechazar);
  informacion.append(nombre, username, acciones);
  tarjeta.appendChild(informacion);
  return tarjeta;
}

export async function menuSolicitudes(): Promise<void> {
  if (!solicitudesDiv) return;
  const usuarioActualId = obtenerUserId();
  if (usuarioActualId === null) return;

  const menuSugerencias = document.createElement('section');
  menuSugerencias.className = 'menuDeSugerencias';
  const tituloSugerencias = document.createElement('h2');
  tituloSugerencias.className = 'titulo-sugerencias';
  tituloSugerencias.textContent = 'Sugerencias';
  const listaSugerencias = document.createElement('div');
  listaSugerencias.className = 'lista-sugerencias';
  menuSugerencias.append(tituloSugerencias, listaSugerencias);

  const menuSolicitudes = document.createElement('aside');
  menuSolicitudes.className = 'menuDeSolicitudes';
  const tituloSolicitudes = document.createElement('h2');
  tituloSolicitudes.className = 'titulo-solicitudes';
  tituloSolicitudes.textContent = 'Solicitudes';
  const listaSolicitudes = document.createElement('div');
  listaSolicitudes.className = 'lista-solicitudes';
  menuSolicitudes.append(tituloSolicitudes, listaSolicitudes);
  solicitudesDiv.append(menuSugerencias, menuSolicitudes);

  const cargarSolicitudes = async (): Promise<void> => {
    listaSolicitudes.replaceChildren();
    try {
      const solicitudes = await obtenerSolicitudesPendientes(usuarioActualId);
      solicitudes.forEach((solicitud) => {
        listaSolicitudes.appendChild(crearTarjetaSolicitud(solicitud, () => {
          void cargarSolicitudes();
        }));
      });
    } catch (error) {
      console.error('No se pudieron cargar las solicitudes pendientes:', error);
      const mensaje = document.createElement('p');
      mensaje.textContent = 'No se pudieron cargar las solicitudes.';
      listaSolicitudes.appendChild(mensaje);
    }
  };

  try {
    const usuarios = await obtenerUsuarios();
    const candidatos = usuarios.filter((usuario) => usuario.id !== usuarioActualId);
    const estados = await Promise.allSettled(candidatos.map((usuario) =>
      obtenerEstadoSeguimiento(usuarioActualId, usuario.id)
    ));
    candidatos.forEach((usuario, indice) => {
      const resultado = estados[indice];
      const estado = resultado?.status === 'fulfilled' ? resultado.value.status : 'ERROR';
      if (resultado?.status === 'rejected') {
        console.error(`No se pudo consultar el estado de seguimiento del usuario ${usuario.id}:`, resultado.reason);
      }
      listaSugerencias.appendChild(crearTarjetaSugerencia(usuario, usuarioActualId, estado));
    });
  } catch (error) {
    console.error('No se pudieron cargar las sugerencias:', error);
    const mensaje = document.createElement('p');
    mensaje.textContent = 'No se pudieron cargar las sugerencias. Verifica el endpoint de usuarios.';
    listaSugerencias.appendChild(mensaje);
  }

  await cargarSolicitudes();
}
