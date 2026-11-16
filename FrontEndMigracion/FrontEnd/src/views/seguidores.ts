import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerUserId } from '../features/auth/authGuard';
import {
  eliminarSeguimiento,
  obtenerCantidadSeguidores,
  obtenerCantidadSeguidos,
  obtenerSeguidores,
  obtenerSeguidos,
  type RelacionSeguimiento,
} from '../features/usuario/seguimiento.api';

const contenedor = document.querySelector<HTMLDivElement>('.seguidores');

interface PersonaSeguimiento {
  id: number;
  name: string;
  username: string;
  profilePhoto: string;
}

type TipoSeguimiento = 'seguidores' | 'seguidos';

function resolverUrlFoto(url: string | null | undefined): string {
  if (!url) return fotoPorDefecto;
  return url.startsWith('http') || url.startsWith('data:')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function nombreUsuario(usuario: PersonaSeguimiento): string {
  return usuario.name?.trim() || usuario.username?.trim() || 'Usuario sin nombre';
}

function extraerPersona(
  relacion: RelacionSeguimiento,
  tipo: TipoSeguimiento
): PersonaSeguimiento {
  return tipo === 'seguidores'
    ? {
        id: relacion.followerId,
        name: relacion.followerName,
        username: relacion.followerUsername,
        profilePhoto: relacion.followerProfilePhoto,
      }
    : {
        id: relacion.followedId,
        name: relacion.followedName,
        username: relacion.followedUsername,
        profilePhoto: relacion.followedProfilePhoto,
      };
}

function renderizarPersona(
  usuario: PersonaSeguimiento,
  tipo: TipoSeguimiento,
  userId: number,
  actualizar: () => Promise<void>
): HTMLLIElement {
  const elemento = document.createElement('li');
  elemento.className = 'persona-seguimiento';

  const foto = document.createElement('img');
  foto.className = 'foto-persona-seguimiento';
  foto.alt = `Foto de ${nombreUsuario(usuario)}`;
  foto.src = resolverUrlFoto(usuario.profilePhoto);
  foto.onerror = () => {
    foto.onerror = null;
    foto.src = fotoPorDefecto;
  };

  const datos = document.createElement('div');
  datos.className = 'datos-persona-seguimiento';
  const nombre = document.createElement('strong');
  nombre.textContent = nombreUsuario(usuario);
  const username = document.createElement('span');
  username.textContent = usuario.username ? `@${usuario.username}` : '';
  datos.append(nombre, username);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-eliminar-seguimiento';
  boton.textContent = tipo === 'seguidores' ? 'Eliminar' : 'Dejar de seguir';
  boton.addEventListener('click', async () => {
    if (boton.disabled || !usuario.id) return;
    const confirmado = window.confirm(
      tipo === 'seguidores'
        ? `¿Quieres eliminar a ${nombreUsuario(usuario)} de tus seguidores?`
        : `¿Quieres dejar de seguir a ${nombreUsuario(usuario)}?`
    );
    if (!confirmado) return;

    boton.disabled = true;
    boton.textContent = 'Eliminando...';
    try {
      await eliminarSeguimiento(
        tipo === 'seguidores' ? usuario.id : userId,
        tipo === 'seguidores' ? userId : usuario.id
      );
      await actualizar();
    } catch (error) {
      console.error('No se pudo eliminar el seguimiento:', error);
      boton.disabled = false;
      boton.textContent = tipo === 'seguidores' ? 'Eliminar' : 'Dejar de seguir';
      window.alert('No se pudo actualizar la relación. Intenta nuevamente.');
    }
  });

  elemento.append(foto, datos, boton);
  return elemento;
}

function crearLista(
  tipo: TipoSeguimiento,
  relaciones: RelacionSeguimiento[],
  userId: number,
  actualizar: () => Promise<void>
): HTMLUListElement {
  const lista = document.createElement('ul');
  lista.className = 'lista-seguimiento';
  if (relaciones.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'estado-lista-seguimiento';
    vacio.textContent = tipo === 'seguidores'
      ? 'Aún no tienes seguidores.'
      : 'Aún no sigues a nadie.';
    lista.append(vacio);
    return lista;
  }
  relaciones.forEach((relacion) => {
    const usuario = extraerPersona(relacion, tipo);
    lista.append(renderizarPersona(usuario, tipo, userId, actualizar));
  });
  return lista;
}

async function iniciarSeguidores(): Promise<void> {
  if (!contenedor) return;
  const userId = obtenerUserId();
  if (userId === null) return;

  const pagina = document.createElement('main');
  pagina.className = 'contenido-seguidores';
  const encabezado = document.createElement('header');
  encabezado.className = 'encabezado-seguidores';
  const titulo = document.createElement('h1');
  titulo.textContent = 'Seguidores y seguidos';
  encabezado.append(titulo);

  const estado = document.createElement('p');
  estado.className = 'estado-carga-seguimiento';
  estado.textContent = 'Cargando relaciones...';
  pagina.append(encabezado, estado);
  contenedor.append(pagina);

  try {
    let [seguidores, seguidos, cantidadSeguidores, cantidadSeguidos] = await Promise.all([
      obtenerSeguidores(userId),
      obtenerSeguidos(userId),
      obtenerCantidadSeguidores(userId),
      obtenerCantidadSeguidos(userId),
    ]);

    const panel = document.createElement('section');
    panel.className = 'panel-seguimiento';
    const pestañas = document.createElement('div');
    pestañas.className = 'pestanas-seguimiento';
    const contenido = document.createElement('div');
    contenido.className = 'contenido-lista-seguimiento';

    const actualizar = async (): Promise<void> => {
      const datos = await Promise.all([
        obtenerSeguidores(userId),
        obtenerSeguidos(userId),
        obtenerCantidadSeguidores(userId),
        obtenerCantidadSeguidos(userId),
      ]);
      [seguidores, seguidos, cantidadSeguidores, cantidadSeguidos] = datos;
      const botonSeguidores = pestañas.querySelector<HTMLButtonElement>(
        '[data-tipo="seguidores"]'
      );
      const botonSeguidos = pestañas.querySelector<HTMLButtonElement>('[data-tipo="seguidos"]');
      if (botonSeguidores) botonSeguidores.textContent = `Seguidores (${cantidadSeguidores})`;
      if (botonSeguidos) botonSeguidos.textContent = `Seguidos (${cantidadSeguidos})`;
      const pestañaActiva = pestañas.querySelector<HTMLButtonElement>('.pestana-activa');
      renderizarContenido(pestañaActiva?.dataset.tipo === 'seguidos' ? 'seguidos' : 'seguidores');
    };

    const renderizarContenido = (tipo: 'seguidores' | 'seguidos'): void => {
      contenido.replaceChildren(
        crearLista(tipo, tipo === 'seguidores' ? seguidores : seguidos, userId, actualizar)
      );
      pestañas.querySelectorAll('button').forEach((boton) => {
        boton.classList.toggle('pestana-activa', boton.dataset.tipo === tipo);
      });
    };

    const crearPestana = (tipo: 'seguidores' | 'seguidos', texto: string, cantidad: number) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'pestana-seguimiento';
      boton.dataset.tipo = tipo;
      boton.textContent = `${texto} (${cantidad})`;
      boton.addEventListener('click', () => renderizarContenido(tipo));
      return boton;
    };

    pestañas.append(
      crearPestana('seguidores', 'Seguidores', cantidadSeguidores),
      crearPestana('seguidos', 'Seguidos', cantidadSeguidos)
    );
    panel.append(pestañas, contenido);
    estado.remove();
    pagina.append(panel);
    renderizarContenido('seguidores');
  } catch (error) {
    console.error('No se pudieron cargar los seguidores y seguidos:', error);
    estado.textContent = 'No se pudieron cargar tus seguidores y seguidos. Intenta nuevamente.';
    estado.classList.add('estado-error');
  }
}

void iniciarSeguidores();