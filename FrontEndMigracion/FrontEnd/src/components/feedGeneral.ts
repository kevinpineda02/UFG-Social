import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import {
  obtenerCantidadLikes,
  obtenerComentariosPorPublicacion,
  obtenerImagenesPorPublicacion,
  obtenerPublicaciones,
  type Comentario,
  type Publicacion,
} from '../features/publicaciones/publicaciones.api';

function resolverUrl(url: string | null | undefined, valorPorDefecto: string): string {
  if (!url) {
    return valorPorDefecto;
  }

  return url.startsWith('http') || url.startsWith('data:')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function tiempoTranscurrido(fecha: string): string {
  const diferencia = Date.now() - new Date(fecha).getTime();
  const minutos = Math.max(0, Math.floor(diferencia / 60000));

  if (minutos < 1) {
    return 'Ahora';
  }
  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return `${horas} h`;
  }

  const dias = Math.floor(horas / 24);
  return `${dias} d`;
}

function crearIconoComentario(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4.5 4.5h15A2.5 2.5 0 0 1 22 7v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.75 3v-3H4.5A2.5 2.5 0 0 1 2 15V7a2.5 2.5 0 0 1 2.5-2.5Zm2 4.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm5.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm5.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"/>
    </svg>`;
}

function crearIconoMeGusta(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 21s-8.5-4.9-10.5-10.2C.15 7.24 2.3 3.5 6.1 3.5c2.17 0 3.75 1.2 4.9 2.7 1.15-1.5 2.73-2.7 4.9-2.7 3.8 0 5.95 3.74 4.6 7.3C20.5 16.1 12 21 12 21Z"/>
    </svg>`;
}

async function cargarDetallesPublicacion(publicacion: Publicacion): Promise<Publicacion> {
  const [resultadoLikes, resultadoImagenes, resultadoComentarios] = await Promise.allSettled([
    obtenerCantidadLikes(publicacion.id),
    obtenerImagenesPorPublicacion(publicacion.id),
    obtenerComentariosPorPublicacion(publicacion.id),
  ]);

  if (resultadoLikes.status === 'fulfilled') {
    publicacion.likes = resultadoLikes.value;
  } else {
    console.error(`No se pudo cargar el contador de likes de la publicación ${publicacion.id}:`, resultadoLikes.reason);
  }

  if (resultadoImagenes.status === 'fulfilled') {
    publicacion.images = resultadoImagenes.value;
  } else {
    console.error(`No se pudieron cargar las imágenes de la publicación ${publicacion.id}:`, resultadoImagenes.reason);
  }

  if (resultadoComentarios.status === 'fulfilled') {
    publicacion.commentsList = resultadoComentarios.value;
    publicacion.coments = resultadoComentarios.value.length;
  } else {
    console.error(`No se pudieron cargar los comentarios de la publicación ${publicacion.id}:`, resultadoComentarios.reason);
  }

  return publicacion;
}

function crearListaComentarios(comentarios: Comentario[]): HTMLElement {
  const lista = document.createElement('div');
  lista.className = 'lista-comentarios';

  if (comentarios.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'comentarios-vacio';
    vacio.textContent = 'Todavía no hay comentarios.';
    lista.append(vacio);
    return lista;
  }

  comentarios.forEach((comentario) => {
    const elemento = document.createElement('article');
    elemento.className = 'comentario-publicacion';

    const autor = document.createElement('strong');
    autor.textContent = comentario.username || comentario.user || 'Usuario';

    const texto = document.createElement('span');
    texto.textContent = comentario.comment;

    elemento.append(autor, texto);
    lista.append(elemento);
  });

  return lista;
}

function crearPublicacion(publicacion: Publicacion): HTMLElement {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta-publicacion';

  const encabezado = document.createElement('header');
  encabezado.className = 'encabezado-publicacion';

  const fotoAutor = document.createElement('img');
  fotoAutor.className = 'foto-autor-publicacion';
  fotoAutor.src = resolverUrl(publicacion.profilePhoto, fotoPorDefecto);
  fotoAutor.alt = `Foto de ${publicacion.username || publicacion.user || 'usuario'}`;
  fotoAutor.onerror = () => {
    fotoAutor.onerror = null;
    fotoAutor.src = fotoPorDefecto;
  };

  const datosAutor = document.createElement('div');
  datosAutor.className = 'datos-autor-publicacion';

  const nombreAutor = document.createElement('strong');
  nombreAutor.textContent = publicacion.username || publicacion.user || 'Usuario';

  const fechaPublicacion = document.createElement('time');
  fechaPublicacion.dateTime = publicacion.creationDate;
  fechaPublicacion.textContent = tiempoTranscurrido(publicacion.creationDate);

  datosAutor.append(nombreAutor, fechaPublicacion);
  encabezado.append(fotoAutor, datosAutor);

  const menuPublicacion = document.createElement('button');
  menuPublicacion.className = 'menu-publicacion';
  menuPublicacion.type = 'button';
  menuPublicacion.ariaLabel = 'Opciones de publicación';
  menuPublicacion.textContent = '⋮';
  encabezado.append(menuPublicacion);

  const contenido = document.createElement('div');
  contenido.className = 'contenido-publicacion';

  if (publicacion.description?.trim()) {
    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-publicacion';
    descripcion.textContent = publicacion.description;
    contenido.append(descripcion);
  }

  const imagenes = [...(publicacion.images ?? [])].sort(
    (primera, segunda) => primera.orderImage - segunda.orderImage
  );
  if (imagenes.length > 0) {
    const galeria = document.createElement('div');
    galeria.className = `galeria-publicacion ${imagenes.length > 1 ? 'galeria-multiple' : ''}`;

    imagenes.forEach((imagen) => {
      const imagenPublicacion = document.createElement('img');
      imagenPublicacion.src = resolverUrl(imagen.imageUrl, '');
      imagenPublicacion.alt = 'Imagen de la publicación';
      imagenPublicacion.loading = 'lazy';
      galeria.append(imagenPublicacion);
    });

    contenido.append(galeria);
  }

  if (publicacion.videoUrl) {
    const video = document.createElement('video');
    video.className = 'video-publicacion';
    video.src = resolverUrl(publicacion.videoUrl, '');
    video.controls = true;
    video.preload = 'metadata';
    contenido.append(video);
  }

  const acciones = document.createElement('footer');
  acciones.className = 'acciones-publicacion';

  const botonMeGusta = document.createElement('button');
  botonMeGusta.type = 'button';
  botonMeGusta.className = `accion-publicacion ${publicacion.likedByCurrentUser ? 'accion-me-gusta-activa' : ''}`;
  botonMeGusta.innerHTML = `${crearIconoMeGusta()}<span>Me gusta</span><strong>${publicacion.likes ?? 0}</strong>`;
  botonMeGusta.ariaLabel = 'Me gusta';

  const botonComentarios = document.createElement('button');
  botonComentarios.type = 'button';
  botonComentarios.className = 'accion-publicacion';
  botonComentarios.innerHTML = `${crearIconoComentario()}<span>Comentarios</span><strong>${publicacion.coments ?? 0}</strong>`;
  botonComentarios.ariaLabel = 'Comentarios';

  const comentarios = document.createElement('div');
  comentarios.className = 'contenedor-comentarios';
  comentarios.hidden = true;
  comentarios.append(crearListaComentarios(publicacion.commentsList ?? []));
  botonComentarios.addEventListener('click', () => {
    comentarios.hidden = !comentarios.hidden;
  });

  acciones.append(botonMeGusta, botonComentarios);
  tarjeta.append(encabezado, contenido, acciones, comentarios);
  return tarjeta;
}

export async function feedGeneral(): Promise<void> {
  const contenedorFeed = document.querySelector<HTMLElement>('.feed');
  if (!contenedorFeed) {
    return;
  }

  const contenidoFeed = document.createElement('section');
  contenidoFeed.className = 'contenido-feed';

  const titulo = document.createElement('h1');
  titulo.className = 'titulo-feed';
  titulo.textContent = 'Feed';

  const contenedorPublicaciones = document.createElement('div');
  contenedorPublicaciones.className = 'contenedor-publicaciones';
  const estado = document.createElement('p');
  estado.className = 'estado-publicaciones';
  estado.textContent = 'Cargando publicaciones...';
  contenedorPublicaciones.append(estado);

  contenidoFeed.append(titulo, contenedorPublicaciones);
  contenedorFeed.append(contenidoFeed);

  try {
    const publicaciones = await obtenerPublicaciones();
    contenedorPublicaciones.replaceChildren();

    if (publicaciones.length === 0) {
      estado.textContent = 'Todavía no hay publicaciones.';
      contenedorPublicaciones.append(estado);
      return;
    }

    const publicacionesConDetalles = await Promise.all(
      publicaciones.map((publicacion) => cargarDetallesPublicacion(publicacion))
    );

    publicacionesConDetalles.forEach((publicacion) => {
      contenedorPublicaciones.append(crearPublicacion(publicacion));
    });
  } catch (error) {
    console.error('No se pudieron cargar las publicaciones:', error);
    estado.textContent = 'No se pudieron cargar las publicaciones. Intenta nuevamente.';
    contenedorPublicaciones.replaceChildren(estado);
  }
}

//Logo UFG
const logoUFG = document.createElement('img');
logoUFG.src = './src/assets/fondos/logo.png';
logoUFG.alt = 'Logo de la Universidad Francisco Gavidia';
logoUFG.className = 'logo-ufg';
document.body.append(logoUFG);