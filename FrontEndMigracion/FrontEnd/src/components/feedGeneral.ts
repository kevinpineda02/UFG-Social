import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerRol, obtenerUserId } from '../features/auth/authGuard';
import { obtenerUsuarioPorId } from '../features/usuario/usuario.api';
import {
  crearComentario,
  darMeGusta,
  eliminarComentario,
  eliminarPublicacion,
  quitarMeGusta,
  obtenerCantidadLikes,
  obtenerEstadoMeGusta,
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"/>
    </svg>`;
}

function crearIconoMeGusta(): string {
  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
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

function crearListaComentarios(
  comentarios: Comentario[],
  userId: number | null,
  onEliminar: (comentario: Comentario) => void,
  onResponder: (comentario: Comentario) => void
): HTMLElement {
  const lista = document.createElement('div');
  lista.className = 'lista-comentarios';
  const rolActual = obtenerRol()?.toUpperCase();

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

    const autorComentario = document.createElement('div');
    autorComentario.className = 'autor-comentario';

    const fotoAutor = document.createElement('img');
    fotoAutor.className = 'foto-comentario';
    fotoAutor.src = resolverUrl(comentario.profilePhoto, fotoPorDefecto);
    fotoAutor.alt = `Foto de ${comentario.username || comentario.user || 'usuario'}`;
    fotoAutor.onerror = () => {
      fotoAutor.onerror = null;
      fotoAutor.src = fotoPorDefecto;
    };

    const autor = document.createElement('strong');
    const nombreAutor = comentario.username || comentario.user || 'Usuario';
    autor.textContent = `@${nombreAutor.replace(/^@/, '')}`;
    const fechaComentario = document.createElement('time');
    fechaComentario.className = 'fecha-comentario';
    fechaComentario.dateTime = comentario.creationDate;
    fechaComentario.textContent = tiempoTranscurrido(comentario.creationDate);
    autorComentario.append(fotoAutor, autor);
    autorComentario.append(fechaComentario);

    const texto = document.createElement('span');
    texto.textContent = comentario.comment;

    const responder = document.createElement('button');
    responder.type = 'button';
    responder.className = 'responder-comentario';
    responder.textContent = 'Responder';
    responder.addEventListener('click', () => onResponder(comentario));

    elemento.append(autorComentario, texto, responder);
    if (userId !== null && (comentario.userId === userId || rolActual === 'ADMIN')) {
      const menuContenedor = document.createElement('div');
      menuContenedor.className = 'menu-comentario';

      const menuBoton = document.createElement('button');
      menuBoton.type = 'button';
      menuBoton.className = 'boton-menu-comentario';
      menuBoton.ariaLabel = 'Opciones del comentario';
      menuBoton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>`;

      const eliminar = document.createElement('button');
      eliminar.type = 'button';
      eliminar.className = 'eliminar-comentario';
      eliminar.textContent = 'Eliminar comentario';
      eliminar.addEventListener('click', () => onEliminar(comentario));
      eliminar.hidden = true;
      menuBoton.addEventListener('click', () => {
        eliminar.hidden = !eliminar.hidden;
      });

      menuContenedor.append(menuBoton, eliminar);
      elemento.append(menuContenedor);
    }
    lista.append(elemento);
  });

  return lista;
}

function crearPanelComentarios(
  publicacion: Publicacion,
  actualizarContador: () => void
): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'contenedor-comentarios';
  const userId = obtenerUserId();
  let comentarios = [...(publicacion.commentsList ?? [])];

  const lista = document.createElement('div');
  lista.className = 'lista-comentarios';
  const actualizarLista = (): void => {
    lista.replaceChildren(
      crearListaComentarios(comentarios, userId, (comentario) => {
        void eliminarComentarioPublicacion(comentario);
      }, (comentario) => {
        const nombre = (comentario.username || comentario.user || 'usuario').replace(/^@/, '').trim();
        const mencion = `@${nombre}`;
        const textoActual = entrada.value.trimEnd();
        entrada.value = textoActual.endsWith(mencion)
          ? `${textoActual} `
          : `${textoActual ? `${textoActual} ` : ''}${mencion} `;
        entrada.focus();
        entrada.setSelectionRange(entrada.value.length, entrada.value.length);
      })
    );
  };

  const eliminarComentarioPublicacion = async (comentario: Comentario): Promise<void> => {
    if (userId === null) {
      return;
    }
    try {
      await eliminarComentario(comentario.id, userId);
      comentarios = comentarios.filter((elemento) => elemento.id !== comentario.id);
      publicacion.commentsList = comentarios;
      publicacion.coments = comentarios.length;
      actualizarLista();
      actualizarContador();
    } catch (error) {
      console.error(`No se pudo eliminar el comentario ${comentario.id}:`, error);
    }
  };

  const formulario = document.createElement('form');
  formulario.className = 'formulario-comentario';
  const perfilComentario = document.createElement('div');
  perfilComentario.className = 'perfil-comentario';
  const fotoPerfilComentario = document.createElement('img');
  fotoPerfilComentario.className = 'foto-perfil-comentario';
  fotoPerfilComentario.src = fotoPorDefecto;
  fotoPerfilComentario.alt = 'Foto de perfil';
  const nombrePerfilComentario = document.createElement('strong');
  nombrePerfilComentario.className = 'nombre-perfil-comentario';
  nombrePerfilComentario.textContent = 'Usuario';
  perfilComentario.append(fotoPerfilComentario, nombrePerfilComentario);

  const cuerpoFormulario = document.createElement('div');
  cuerpoFormulario.className = 'cuerpo-formulario-comentario';
  const entrada = document.createElement('textarea');
  entrada.className = 'entrada-comentario';
  entrada.placeholder = 'Escribe un comentario...';
  entrada.maxLength = 500;
  entrada.rows = 1;
  const enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'enviar-comentario';
  enviar.ariaLabel = 'Enviar comentario';
  enviar.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.7 2.3a1 1 0 0 0-1.05-.22l-18 7a1 1 0 0 0 .08 1.9l7.2 2.4 2.4 7.2a1 1 0 0 0 .91.68h.03a1 1 0 0 0 .92-.62l7-18a1 1 0 0 0-.49-1.34ZM18.83 5.17l-7.58 6.32-5.22-1.74 12.8-4.98Zm-5.47 12.1-1.75-5.23 6.32-5.26-4.57 10.49Z"/>
    </svg>`;
  cuerpoFormulario.append(entrada, enviar);
  formulario.append(perfilComentario, cuerpoFormulario);

  if (userId !== null) {
    void obtenerUsuarioPorId(userId)
      .then((usuario) => {
        nombrePerfilComentario.textContent = usuario.username?.trim() || usuario.name?.trim() || 'Usuario';
        if (usuario.profilePhoto) {
          fotoPerfilComentario.src = resolverUrl(usuario.profilePhoto, fotoPorDefecto);
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el perfil para comentar:', error);
      });
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (userId === null || !entrada.value.trim()) {
      return;
    }
    enviar.disabled = true;
    void crearComentario(publicacion.id, userId, entrada.value.trim())
      .then((comentario) => {
        comentarios.push(comentario);
        publicacion.commentsList = comentarios;
        publicacion.coments = comentarios.length;
        entrada.value = '';
        actualizarLista();
        actualizarContador();
      })
      .catch((error) => {
        console.error(`No se pudo crear un comentario en la publicación ${publicacion.id}:`, error);
      })
      .finally(() => {
        enviar.disabled = false;
      });
  });

  contenedor.append(formulario, lista);
  actualizarLista();
  return contenedor;
}

type MedioPublicacion =
  | { tipo: 'imagen'; url: string; alt: string }
  | { tipo: 'video'; url: string };

function crearCarruselMedios(medios: MedioPublicacion[]): HTMLElement {
  const carrusel = document.createElement('div');
  carrusel.className = `carrusel-publicacion ${medios.length > 1 ? 'carrusel-multiple' : ''}`;
  carrusel.setAttribute('aria-label', 'Contenido multimedia de la publicación');

  const pista = document.createElement('div');
  pista.className = 'pista-carrusel-publicacion';
  const diapositivas: HTMLElement[] = [];
  const indicadores: HTMLButtonElement[] = [];
  let indiceActual = 0;

  medios.forEach((medio, indice) => {
    const diapositiva = document.createElement('div');
    diapositiva.className = 'diapositiva-publicacion';
    diapositiva.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');

    if (medio.tipo === 'imagen') {
      const imagen = document.createElement('img');
      imagen.src = medio.url;
      imagen.alt = medio.alt;
      imagen.loading = indice === 0 ? 'eager' : 'lazy';
      diapositiva.append(imagen);
    } else {
      const video = document.createElement('video');
      video.className = 'video-publicacion';
      video.src = medio.url;
      video.controls = true;
      video.preload = 'metadata';
      diapositiva.append(video);
    }

    diapositivas.push(diapositiva);
    pista.append(diapositiva);
  });

  const actualizarCarrusel = (nuevoIndice: number): void => {
    indiceActual = (nuevoIndice + medios.length) % medios.length;
    pista.style.transform = `translateX(-${indiceActual * 100}%)`;

    diapositivas.forEach((diapositiva, indice) => {
      diapositiva.setAttribute('aria-hidden', indice === indiceActual ? 'false' : 'true');
      const video = diapositiva.querySelector('video');
      if (video && indice !== indiceActual) {
        video.pause();
      }
    });

    indicadores.forEach((indicador, indice) => {
      indicador.classList.toggle('indicador-carrusel-activo', indice === indiceActual);
      indicador.setAttribute('aria-current', indice === indiceActual ? 'true' : 'false');
    });
  };

  carrusel.append(pista);

  if (medios.length > 1) {
    const botonAnterior = document.createElement('button');
    botonAnterior.type = 'button';
    botonAnterior.className = 'control-carrusel control-carrusel-anterior';
    botonAnterior.ariaLabel = 'Medio anterior';
    botonAnterior.textContent = '‹';
    botonAnterior.addEventListener('click', () => actualizarCarrusel(indiceActual - 1));

    const botonSiguiente = document.createElement('button');
    botonSiguiente.type = 'button';
    botonSiguiente.className = 'control-carrusel control-carrusel-siguiente';
    botonSiguiente.ariaLabel = 'Medio siguiente';
    botonSiguiente.textContent = '›';
    botonSiguiente.addEventListener('click', () => actualizarCarrusel(indiceActual + 1));

    const indicadoresContenedor = document.createElement('div');
    indicadoresContenedor.className = 'indicadores-carrusel';
    medios.forEach((_, indice) => {
      const indicador = document.createElement('button');
      indicador.type = 'button';
      indicador.className = 'indicador-carrusel';
      indicador.ariaLabel = `Mostrar medio ${indice + 1}`;
      indicador.setAttribute('aria-current', indice === 0 ? 'true' : 'false');
      indicador.addEventListener('click', () => actualizarCarrusel(indice));
      indicadores.push(indicador);
      indicadoresContenedor.append(indicador);
    });

    carrusel.append(botonAnterior, botonSiguiente, indicadoresContenedor);
    carrusel.tabIndex = 0;
    carrusel.addEventListener('keydown', (evento) => {
      if (evento.key === 'ArrowLeft') {
        actualizarCarrusel(indiceActual - 1);
      } else if (evento.key === 'ArrowRight') {
        actualizarCarrusel(indiceActual + 1);
      }
    });
  }

  return carrusel;
}

export function crearTarjetaPublicacion(publicacion: Publicacion): HTMLElement {
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
  const userId = obtenerUserId();
  const rolActual = obtenerRol()?.toUpperCase();
  if (userId !== null && (publicacion.idUser === userId || rolActual === 'ADMIN')) {
    const menuContenedor = document.createElement('div');
    menuContenedor.className = 'menu-publicacion-contenedor';

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'eliminar-publicacion';
    eliminar.textContent = 'Eliminar publicación';
    eliminar.hidden = true;
    eliminar.addEventListener('click', () => {
      eliminar.disabled = true;
      void eliminarPublicacion(publicacion.id, userId)
        .then(() => {
          tarjeta.remove();
        })
        .catch((error) => {
          console.error(`No se pudo eliminar la publicación ${publicacion.id}:`, error);
          eliminar.disabled = false;
        });
    });

    menuContenedor.append(menuPublicacion, eliminar);
    menuPublicacion.addEventListener('click', () => {
      eliminar.hidden = !eliminar.hidden;
    });
    encabezado.append(menuContenedor);
  }

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
  const medios: MedioPublicacion[] = imagenes.map((imagen) => ({
    tipo: 'imagen',
    url: resolverUrl(imagen.imageUrl, ''),
    alt: 'Imagen de la publicación',
  }));
  if (publicacion.videoUrl) {
    medios.push({ tipo: 'video', url: resolverUrl(publicacion.videoUrl, '') });
  }
  if (medios.length > 0) {
    contenido.append(crearCarruselMedios(medios));
  }

  const separadorAcciones = document.createElement('div');
  separadorAcciones.className = 'separador-acciones-publicacion';

  const acciones = document.createElement('footer');
  acciones.className = 'acciones-publicacion';

  const botonMeGusta = document.createElement('button');
  botonMeGusta.type = 'button';
  botonMeGusta.className = `accion-publicacion ${publicacion.likedByCurrentUser ? 'accion-me-gusta-activa' : ''}`;
  botonMeGusta.innerHTML = `${crearIconoMeGusta()}<strong>${publicacion.likes ?? 0}</strong>`;
  botonMeGusta.ariaLabel = 'Me gusta';
  let actualizandoMeGusta = false;
  botonMeGusta.addEventListener('click', async () => {
    if (actualizandoMeGusta) {
      return;
    }

    const userId = obtenerUserId();
    if (userId === null) {
      return;
    }

    actualizandoMeGusta = true;
    botonMeGusta.disabled = true;
    try {
      if (publicacion.likedByCurrentUser) {
        await quitarMeGusta(publicacion.id, userId);
      } else {
        await darMeGusta(publicacion.id, userId);
      }

      const cantidadLikes = await obtenerCantidadLikes(publicacion.id);
      publicacion.likedByCurrentUser = !publicacion.likedByCurrentUser;
      publicacion.likes = cantidadLikes;
      botonMeGusta.classList.toggle('accion-me-gusta-activa', publicacion.likedByCurrentUser);
      const contador = botonMeGusta.querySelector('strong');
      if (contador) {
        contador.textContent = String(cantidadLikes);
      }
    } catch (error) {
      console.error(`No se pudo actualizar el like de la publicación ${publicacion.id}:`, error);
    } finally {
      actualizandoMeGusta = false;
      botonMeGusta.disabled = false;
    }
  });

  if (userId !== null) {
    actualizandoMeGusta = true;
    botonMeGusta.disabled = true;
    void obtenerEstadoMeGusta(publicacion.id, userId)
      .then((tieneMeGusta) => {
        publicacion.likedByCurrentUser = tieneMeGusta;
        botonMeGusta.classList.toggle('accion-me-gusta-activa', tieneMeGusta);
      })
      .catch((error) => {
        console.error(`No se pudo consultar el like de la publicación ${publicacion.id}:`, error);
      })
      .finally(() => {
        actualizandoMeGusta = false;
        botonMeGusta.disabled = false;
      });
  }

  const botonComentarios = document.createElement('button');
  botonComentarios.type = 'button';
  botonComentarios.className = 'accion-publicacion';
  botonComentarios.innerHTML = `${crearIconoComentario()}<strong class="contador-comentarios">${publicacion.coments ?? 0}</strong>`;
  botonComentarios.ariaLabel = 'Comentarios';

  const comentarios = crearPanelComentarios(publicacion, () => {
    const contador = botonComentarios.querySelector('strong');
    if (contador) {
      contador.textContent = String(publicacion.coments ?? 0);
    }
  });
  comentarios.hidden = true;
  botonComentarios.addEventListener('click', () => {
    comentarios.hidden = !comentarios.hidden;
  });

  acciones.append(botonMeGusta, botonComentarios);
  tarjeta.append(encabezado, contenido, comentarios, separadorAcciones, acciones);
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

  const logoUFG = document.createElement('img');
  logoUFG.src = './src/assets/fondos/logo.png';
  logoUFG.alt = 'Logo de la Universidad Francisco Gavidia';
  logoUFG.className = 'logo-ufg';

  const contenedorPublicaciones = document.createElement('div');
  contenedorPublicaciones.className = 'contenedor-publicaciones';
  const estado = document.createElement('p');
  estado.className = 'estado-publicaciones';
  estado.textContent = 'Cargando publicaciones...';
  contenedorPublicaciones.append(estado);

  contenidoFeed.append(logoUFG, titulo, contenedorPublicaciones);
  contenedorFeed.append(contenidoFeed);

  try {
    const publicaciones = await obtenerPublicaciones();
    contenedorPublicaciones.replaceChildren();

    if (publicaciones.length === 0) {
      estado.textContent = 'Todavía no hay publicaciones.';
      contenedorPublicaciones.append(estado);
      return;
    }

    const publicacionesOrdenadas = [...publicaciones].sort(
      (primera, segunda) =>
        new Date(segunda.creationDate).getTime() - new Date(primera.creationDate).getTime()
    );

    const publicacionesConDetalles = await Promise.all(
      publicacionesOrdenadas.map((publicacion) => cargarDetallesPublicacion(publicacion))
    );

    publicacionesConDetalles.forEach((publicacion) => {
      contenedorPublicaciones.append(crearTarjetaPublicacion(publicacion));
    });
  } catch (error) {
    console.error('No se pudieron cargar las publicaciones:', error);
    estado.textContent = 'No se pudieron cargar las publicaciones. Intenta nuevamente.';
    contenedorPublicaciones.replaceChildren(estado);
  }
}
