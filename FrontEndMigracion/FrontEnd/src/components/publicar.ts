//Contenedor de la publicacion
import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerUserId } from '../features/auth/authGuard';
import { crearPublicacion } from '../features/publicaciones/publicar.api';
import { obtenerUsuarioPorId } from '../features/usuario/usuario.api';

const publicarDiv = document.querySelector('.publicacion');

const contenidoPublicar = document.createElement('div');
contenidoPublicar.classList.add('contenido-publicar');

//Crear titulo del panel de publicacion
const tituloPublicar = document.createElement('h2');
tituloPublicar.classList.add('titulo-publicar');
tituloPublicar.textContent = 'Publicar contenido';

//Crear panel para publicar contenido
const publicarPanelDiv = document.createElement('div');
publicarPanelDiv.classList.add('publicar-panel');

const perfilPublicar = document.createElement('div');
perfilPublicar.classList.add('perfil-publicar');

const fotoPerfil = document.createElement('img');
fotoPerfil.classList.add('foto-publicar');
fotoPerfil.alt = 'Foto de perfil';
fotoPerfil.src = fotoPorDefecto;

const nombreUsuario = document.createElement('span');
nombreUsuario.classList.add('nombre-publicar');
nombreUsuario.textContent = 'Cargando usuario...';

perfilPublicar.append(fotoPerfil, nombreUsuario);
publicarPanelDiv.append(perfilPublicar);

//Renderizar el titulo y el panel de publicacion en el contenedor
contenidoPublicar.append(tituloPublicar, publicarPanelDiv);
publicarDiv?.appendChild(contenidoPublicar);

async function cargarPerfil(): Promise<void> {
  const userId = obtenerUserId();
  if (userId === null) {
    nombreUsuario.textContent = 'Usuario sin sesión';
    return;
  }

  try {
    const usuario = await obtenerUsuarioPorId(userId);
    const nombre = usuario.username?.trim() || usuario.name?.trim();
    nombreUsuario.textContent = nombre || 'Usuario sin nombre';

    if (usuario.profilePhoto) {
      fotoPerfil.src = usuario.profilePhoto.startsWith('http') || usuario.profilePhoto.startsWith('data:')
        ? usuario.profilePhoto
        : `${API_BASE_URL}${usuario.profilePhoto.startsWith('/') ? usuario.profilePhoto : `/${usuario.profilePhoto}`}`;
    }
  } catch (error) {
    console.error('No se pudo cargar el perfil para publicar:', error);
    nombreUsuario.textContent = 'No se pudo cargar el usuario';
  }
}

//Input para escribir la publicacion
const inputPublicacionDiv = document.createElement('div');
inputPublicacionDiv.classList.add('input-publicar-div');
const inputPublicacion = document.createElement('textarea');
inputPublicacion.classList.add('input-publicar');
inputPublicacion.placeholder = '¿Qué quieres compartir?';
inputPublicacionDiv.appendChild(inputPublicacion);
publicarPanelDiv.appendChild(inputPublicacionDiv);

const vistaPreviaDiv = document.createElement('div');
vistaPreviaDiv.classList.add('vista-previa-publicar');
publicarPanelDiv.appendChild(vistaPreviaDiv);

//Botones de publicaciones
const botonesPublicacionDiv = document.createElement('div');
botonesPublicacionDiv.classList.add('botones-publicar');

const selectorImagenes = document.createElement('input');
selectorImagenes.type = 'file';
selectorImagenes.accept = 'image/*';
selectorImagenes.multiple = true;
selectorImagenes.hidden = true;

const selectorVideo = document.createElement('input');
selectorVideo.type = 'file';
selectorVideo.accept = 'video/*';
selectorVideo.hidden = true;

let imagenesSeleccionadas: File[] = [];
let videoSeleccionado: File | null = null;

function actualizarVistaPrevia(): void {
  vistaPreviaDiv.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video').forEach((elemento) => {
    URL.revokeObjectURL(elemento.src);
  });
  vistaPreviaDiv.replaceChildren();

  imagenesSeleccionadas.forEach((imagen, indice) => {
    const elementoPrevia = document.createElement('div');
    elementoPrevia.classList.add('elemento-previa-publicar');

    const imagenVistaPrevia = document.createElement('img');
    imagenVistaPrevia.classList.add('imagen-previa-publicar');
    imagenVistaPrevia.src = URL.createObjectURL(imagen);
    imagenVistaPrevia.alt = `Vista previa de ${imagen.name}`;

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.classList.add('eliminar-previa-publicar');
    botonEliminar.setAttribute('aria-label', `Quitar ${imagen.name}`);
    botonEliminar.textContent = '×';
    botonEliminar.addEventListener('click', () => {
      imagenesSeleccionadas.splice(indice, 1);
      actualizarVistaPrevia();
    });

    elementoPrevia.append(imagenVistaPrevia, botonEliminar);
    vistaPreviaDiv.appendChild(elementoPrevia);
  });

  if (videoSeleccionado) {
    const elementoPrevia = document.createElement('div');
    elementoPrevia.classList.add('elemento-previa-publicar', 'elemento-video-previa-publicar');

    const videoVistaPrevia = document.createElement('video');
    videoVistaPrevia.classList.add('video-previo-publicar');
    videoVistaPrevia.src = URL.createObjectURL(videoSeleccionado);
    videoVistaPrevia.controls = true;
    videoVistaPrevia.muted = true;

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.classList.add('eliminar-previa-publicar');
    botonEliminar.setAttribute('aria-label', 'Quitar video');
    botonEliminar.textContent = '×';
    botonEliminar.addEventListener('click', () => {
      videoSeleccionado = null;
      selectorVideo.value = '';
      actualizarVistaPrevia();
    });

    elementoPrevia.append(videoVistaPrevia, botonEliminar);
    vistaPreviaDiv.appendChild(elementoPrevia);
  }
}

//Boton de Video
const iconoVideo = document.createElement('div');
iconoVideo.classList.add('icono-video');
iconoVideo.title = 'Agregar video';
iconoVideo.innerHTML = `
<svg width="27" height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3.75 0C2.75544 0 1.80161 0.408258 1.09835 1.13496C0.395088 1.86166 0 2.84729 0 3.875V15.5C0 16.5277 0.395088 17.5133 1.09835 18.24C1.80161 18.9667 2.75544 19.375 3.75 19.375H14.0625C15.0571 19.375 16.0109 18.9667 16.7142 18.24C17.4174 17.5133 17.8125 16.5277 17.8125 15.5V3.875C17.8125 2.84729 17.4174 1.86166 16.7142 1.13496C16.0109 0.408258 15.0571 0 14.0625 0H3.75ZM23.05 18.4062L19.6875 14.9317V4.44333L23.05 0.96875C24.23 -0.251875 26.25 0.61225 26.25 2.33792V17.0371C26.25 18.7628 24.23 19.6269 23.05 18.4062Z" fill="#FFF1F1"/>
</svg>`;

//Boton de Encuesta 
const iconoEncuesta = document.createElement('div');
iconoEncuesta.classList.add('icono-encuesta');
iconoEncuesta.title = 'Encuestas próximamente';
iconoEncuesta.innerHTML = `
<svg width="31" height="30" viewBox="0 0 31 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 7.84091C2 6.27121 3.08 5 4.41071 5H26.5893C27.92 5 29 6.27273 29 7.84091V27.1591C29 28.7273 27.92 30 26.5893 30H4.41071C3.77135 30 3.15818 29.7007 2.70608 29.1679C2.25399 28.6351 2 27.9125 2 27.1591V7.84091ZM27.0714 13.5227C27.0714 13.372 27.0206 13.2275 26.9302 13.121C26.8398 13.0144 26.7172 12.9545 26.5893 12.9545H16.9464C16.8186 12.9545 16.6959 13.0144 16.6055 13.121C16.5151 13.2275 16.4643 13.372 16.4643 13.5227V15.7955C16.4643 16.1091 16.6803 16.3636 16.9464 16.3636H26.5893C26.7172 16.3636 26.8398 16.3038 26.9302 16.1972C27.0206 16.0907 27.0714 15.9461 27.0714 15.7955V13.5227ZM27.0714 19.2045C27.0714 19.0539 27.0206 18.9093 26.9302 18.8028C26.8398 18.6962 26.7172 18.6364 26.5893 18.6364H16.9464C16.8186 18.6364 16.6959 18.6962 16.6055 18.8028C16.5151 18.9093 16.4643 19.0539 16.4643 19.2045V21.4773C16.4643 21.7909 16.6803 22.0455 16.9464 22.0455H26.5893C26.7172 22.0455 26.8398 21.9856 26.9302 21.879C27.0206 21.7725 27.0714 21.628 27.0714 21.4773V19.2045ZM27.0714 24.8864C27.0714 24.7357 27.0206 24.5912 26.9302 24.4846C26.8398 24.378 26.7172 24.3182 26.5893 24.3182H16.9464C16.8186 24.3182 16.6959 24.378 16.6055 24.4846C16.5151 24.5912 16.4643 24.7357 16.4643 24.8864V27.1591C16.4643 27.4727 16.6803 27.7273 16.9464 27.7273H26.5893C26.7172 27.7273 26.8398 27.6674 26.9302 27.5609C27.0206 27.4543 27.0714 27.3098 27.0714 27.1591V24.8864ZM14.0536 27.7273C14.1814 27.7273 14.3041 27.6674 14.3945 27.5609C14.4849 27.4543 14.5357 27.3098 14.5357 27.1591V24.8864C14.5357 24.7357 14.4849 24.5912 14.3945 24.4846C14.3041 24.378 14.1814 24.3182 14.0536 24.3182H4.41071C4.28284 24.3182 4.16021 24.378 4.06979 24.4846C3.97937 24.5912 3.92857 24.7357 3.92857 24.8864V27.1591C3.92857 27.4727 4.14457 27.7273 4.41071 27.7273H14.0536ZM4.41071 22.0455H14.0536C14.1814 22.0455 14.3041 21.9856 14.3945 21.879C14.4849 21.7725 14.5357 21.628 14.5357 21.4773V19.2045C14.5357 19.0539 14.4849 18.9093 14.3945 18.8028C14.3041 18.6962 14.1814 18.6364 14.0536 18.6364H4.41071C4.28284 18.6364 4.16021 18.6962 4.06979 18.8028C3.97937 18.9093 3.92857 19.0539 3.92857 19.2045V21.4773C3.92857 21.7909 4.14457 22.0455 4.41071 22.0455ZM4.41071 16.3636H14.0536C14.1814 16.3636 14.3041 16.3038 14.3945 16.1972C14.4849 16.0907 14.5357 15.9461 14.5357 15.7955V13.5227C14.5357 13.372 14.4849 13.2275 14.3945 13.121C14.3041 13.0144 14.1814 12.9545 14.0536 12.9545H4.41071C4.28284 12.9545 4.16021 13.0144 4.06979 13.121C3.97937 13.2275 3.92857 13.372 3.92857 13.5227V15.7955C3.92857 16.1091 4.14457 16.3636 4.41071 16.3636Z" fill-rule="evenodd" clip-rule="evenodd" fill="#FFF1F1"/>
</svg>`;

//Boton de Imagen
const iconoImagen = document.createElement('div');
iconoImagen.classList.add('icono-imagen');
iconoImagen.title = 'Agregar imágenes';
iconoImagen.innerHTML = `
<svg width="31" height="30" viewBox="0 0 31 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 6.32143C0 5.44053 0.349935 4.59571 0.972824 3.97282C1.59571 3.34994 2.44053 3 3.32143 3H27.6786C28.5595 3 29.4043 3.34994 30.0272 3.97282C30.6501 4.59571 31 5.44053 31 6.32143V24.0357C31 24.9166 30.6501 25.7614 30.0272 26.3843C29.4043 27.0072 28.5595 27.3571 27.6786 27.3571H3.32143C2.44053 27.3571 1.59571 27.0072 0.972824 26.3843C0.349935 25.7614 0 24.9166 0 24.0357V6.32143ZM2.21429 21.1719V24.0357C2.21429 24.6469 2.71029 25.1429 3.32143 25.1429H27.6786C27.9722 25.1429 28.2538 25.0262 28.4614 24.8186C28.6691 24.611 28.7857 24.3293 28.7857 24.0357V21.1719L24.8148 17.2024C24.3996 16.7878 23.8368 16.5549 23.25 16.5549C22.6632 16.5549 22.1004 16.7878 21.6852 17.2024L20.3862 18.5L21.8181 19.9319C21.9269 20.0333 22.0141 20.1555 22.0746 20.2913C22.1351 20.4271 22.1677 20.5737 22.1703 20.7224C22.1729 20.871 22.1456 21.0187 22.0899 21.1565C22.0342 21.2944 21.9513 21.4196 21.8462 21.5248C21.7411 21.6299 21.6158 21.7128 21.478 21.7685C21.3401 21.8242 21.1925 21.8515 21.0438 21.8489C20.8951 21.8463 20.7485 21.8137 20.6127 21.7532C20.4769 21.6927 20.3547 21.6054 20.2533 21.4967L12.6362 13.881C12.221 13.4663 11.6582 13.2334 11.0714 13.2334C10.4846 13.2334 9.92185 13.4663 9.50667 13.881L2.21429 21.1734V21.1719ZM17.1607 9.64286C17.1607 9.20241 17.3357 8.78 17.6471 8.46856C17.9586 8.15711 18.381 7.98214 18.8214 7.98214C19.2619 7.98214 19.6843 8.15711 19.9957 8.46856C20.3072 8.78 20.4821 9.20241 20.4821 9.64286C20.4821 10.0833 20.3072 10.5057 19.9957 10.8172C19.6843 11.1286 19.2619 11.3036 18.8214 11.3036C18.381 11.3036 17.9586 11.1286 17.6471 10.8172C17.3357 10.5057 17.1607 10.0833 17.1607 9.64286Z" fill-rule="evenodd" clip-rule="evenodd" fill="#FFF1F1"/>
</svg>`;

//Boton de publicar 
const botonPublicar = document.createElement('div');
botonPublicar.classList.add('boton-publicar');
botonPublicar.title = 'Publicar';
botonPublicar.innerHTML = `<svg width="29" height="30" viewBox="0 0 29 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.99244 2.53722C5.8354 2.49003 5.66895 2.48767 5.51072 2.5304C5.35249 2.57313 5.20838 2.65936 5.09368 2.77993C4.97898 2.90051 4.89795 3.05095 4.8592 3.21531C4.82044 3.37966 4.82539 3.55179 4.87353 3.71347L7.81219 13.5947H18.1024C18.3427 13.5947 18.5732 13.6935 18.7432 13.8693C18.9131 14.0451 19.0086 14.2836 19.0086 14.5322C19.0086 14.7809 18.9131 15.0193 18.7432 15.1951C18.5732 15.3709 18.3427 15.4697 18.1024 15.4697H7.81219L4.87353 25.351C4.82567 25.5126 4.82094 25.6845 4.85982 25.8487C4.89871 26.0129 4.97977 26.1631 5.09443 26.2835C5.20908 26.4039 5.35307 26.49 5.51115 26.5327C5.66923 26.5754 5.83553 26.573 5.99244 26.526C13.9855 24.1214 21.5231 20.3226 28.2802 15.2935C28.3969 15.2067 28.492 15.0923 28.5576 14.96C28.6232 14.8276 28.6575 14.681 28.6575 14.5322C28.6575 14.3835 28.6232 14.2368 28.5576 14.1045C28.492 13.9721 28.3969 13.8578 28.2802 13.771C21.5232 8.74134 13.9856 4.94216 5.99244 2.53722Z" fill="#FFF1F1"/>
</svg>`;

//Renderizar los botones en el panel de publicacion
botonesPublicacionDiv.appendChild(iconoVideo);
botonesPublicacionDiv.appendChild(iconoEncuesta);
botonesPublicacionDiv.appendChild(iconoImagen);
botonesPublicacionDiv.appendChild(botonPublicar);
publicarPanelDiv.appendChild(botonesPublicacionDiv);
publicarPanelDiv.append(selectorImagenes, selectorVideo);

iconoVideo.addEventListener('click', () => {
  selectorVideo.click();
});

iconoEncuesta.addEventListener('click', () => {
  window.alert('Las encuestas estarán disponibles próximamente.');
});

iconoImagen.addEventListener('click', () => {
  selectorImagenes.click();
});

selectorImagenes.addEventListener('change', () => {
  const limiteImagenes = videoSeleccionado ? 4 : 5;
  const archivos = Array.from(selectorImagenes.files ?? []);
  imagenesSeleccionadas = archivos.slice(0, limiteImagenes);
  if (archivos.length > limiteImagenes) {
    window.alert(`Puedes seleccionar hasta ${limiteImagenes} imágenes${videoSeleccionado ? ' cuando agregas un video' : ''}.`);
  }
  actualizarVistaPrevia();
});

selectorVideo.addEventListener('change', () => {
  videoSeleccionado = selectorVideo.files?.[0] ?? null;
  if (videoSeleccionado && imagenesSeleccionadas.length > 4) {
    imagenesSeleccionadas = imagenesSeleccionadas.slice(0, 4);
    window.alert('Al agregar un video, el máximo es de 4 imágenes.');
  }
  actualizarVistaPrevia();
});

botonPublicar.addEventListener('click', async () => {
  const userId = obtenerUserId();
  const descripcion = inputPublicacion.value.trim();

  if (userId === null) {
    window.alert('Tu sesión no es válida. Inicia sesión nuevamente.');
    return;
  }
  if (!descripcion && imagenesSeleccionadas.length === 0 && !videoSeleccionado) {
    window.alert('Agrega una descripción, una imagen o un video.');
    return;
  }

  botonPublicar.classList.add('publicando');
  try {
    await crearPublicacion(userId, descripcion, imagenesSeleccionadas, videoSeleccionado);
    inputPublicacion.value = '';
    imagenesSeleccionadas = [];
    videoSeleccionado = null;
    selectorImagenes.value = '';
    selectorVideo.value = '';
    actualizarVistaPrevia();
    window.alert('Publicación creada correctamente.');
  } catch (error) {
    console.error('No se pudo crear la publicación:', error);
    window.alert('No se pudo crear la publicación. Intenta nuevamente.');
  } finally {
    botonPublicar.classList.remove('publicando');
  }
});


void cargarPerfil();