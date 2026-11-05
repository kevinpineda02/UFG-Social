import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerUserId } from '../features/auth/authGuard';
import { obtenerUsuarioPorId } from '../features/usuario/usuario.api';


// Crear el contenedor del menú hamburguesa
const menuHamburguesa = document.createElement('div');
menuHamburguesa.classList.add('menu-hamburguesa');


// Crear elementos para la foto de perfil y el nombre de usuario
const fotoPerfil = document.createElement('img');
fotoPerfil.classList.add('foto-perfil');
fotoPerfil.alt = 'Foto de perfil';
fotoPerfil.src = fotoPorDefecto;
fotoPerfil.onerror = () => {
  fotoPerfil.onerror = null;
  fotoPerfil.src = fotoPorDefecto;
};

//Crear Contenedores para el nombre de usuario 
const nombreUsuario = document.createElement('span');
nombreUsuario.classList.add('nombre-usuario');
nombreUsuario.textContent = 'Cargando usuario...';

menuHamburguesa.append(fotoPerfil, nombreUsuario);

function resolverUrlFoto(url: string): string {
  return url.startsWith('http') || url.startsWith('data:')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function normalizarRuta(ruta: string): string {
  const rutaSinExtension = ruta.replace(/\.html$/, '');
  return rutaSinExtension === '/' ? '/feed' : rutaSinExtension.replace(/\/$/, '');
}

function marcarBotonActivo(boton: HTMLButtonElement, href: string): void {
  const rutaActual = normalizarRuta(window.location.pathname);
  const rutaBoton = normalizarRuta(new URL(href, window.location.href).pathname);

  if (rutaActual === rutaBoton) {
    boton.classList.add('boton-navegacion-activo');
    boton.setAttribute('aria-current', 'page');
  }
}

//Obtener la informacion del usuario para mostrarla en el menu hamburguesa
async function cargarPerfil(): Promise<void> {
  const userId = obtenerUserId();
  console.log('userId para cargar perfil:', userId);

  if (userId === null) {
    nombreUsuario.textContent = 'Sesión incompleta. Inicia sesión nuevamente.';
    console.warn('No hay userId guardado para cargar el perfil.');
    return;
  }

  try {
    const usuario = await obtenerUsuarioPorId(userId);
    console.log('Usuario recibido:', usuario);
    const nombre = usuario.username?.trim() || usuario.name?.trim();
    nombreUsuario.textContent = nombre ? `@${nombre}` : 'Usuario sin nombre';
    if (usuario.profilePhoto) {
      fotoPerfil.src = resolverUrlFoto(usuario.profilePhoto);
    }
  } catch (error) {
    console.error('No se pudo cargar el perfil:', error);
    nombreUsuario.textContent = 'No se pudo cargar el usuario';
  }
}

const contenedor = document.querySelector<HTMLElement>('.feed, .perfil, .mensajes, .publicacion');
if (contenedor) {
  contenedor.append(menuHamburguesa);
  void cargarPerfil();
}

export async function botonesMenuHamburguesa() {
//Botones de navegacion del menu hamburguesa
const botonesNavegacion = document.createElement('div');
botonesNavegacion.classList.add('botones-navegacion');

//Crear botones de navegacion
//Icono de inicio
const iconoInicio = `
<svg class="icono-inicio" width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
  <path d="M12.4259 4.16108C12.5782 4.00893 12.7847 3.92347 13 3.92347C13.2153 3.92347 13.4218 4.00893 13.5742 4.16108L22.9883 13.5753C23.0633 13.6528 23.153 13.7147 23.2522 13.7572C23.3513 13.7997 23.4579 13.8221 23.5658 13.823C23.6737 13.8239 23.7807 13.8033 23.8805 13.7624C23.9804 13.7215 24.071 13.6611 24.1473 13.5848C24.2235 13.5084 24.2838 13.4177 24.3246 13.3178C24.3654 13.218 24.386 13.111 24.385 13.0031C24.384 12.8952 24.3615 12.7886 24.3189 12.6895C24.2763 12.5904 24.2143 12.5007 24.1367 12.4258L14.7236 3.01167C14.4973 2.78532 14.2285 2.60577 13.9328 2.48328C13.6371 2.36078 13.3201 2.29773 13 2.29773C12.6799 2.29773 12.363 2.36078 12.0672 2.48328C11.7715 2.60577 11.5028 2.78532 11.2764 3.01167L1.86227 12.4258C1.7847 12.5008 1.72285 12.5905 1.68031 12.6897C1.63778 12.7888 1.61542 12.8954 1.61453 13.0033C1.61364 13.1112 1.63425 13.2182 1.67515 13.318C1.71605 13.4178 1.77643 13.5085 1.85275 13.5848C1.92907 13.661 2.01982 13.7213 2.11969 13.7621C2.21956 13.8029 2.32656 13.8234 2.43444 13.8225C2.54232 13.8215 2.64893 13.799 2.74804 13.7564C2.84715 13.7137 2.93677 13.6518 3.01169 13.5742L12.4259 4.16108Z"/>
  <path d="M13 5.88467L21.8389 14.7236C21.8714 14.7561 21.9039 14.7864 21.9375 14.8167V21.5312C21.9375 22.6525 21.0275 23.5625 19.9063 23.5625H16.25C16.0345 23.5625 15.8279 23.4769 15.6755 23.3245C15.5231 23.1722 15.4375 22.9655 15.4375 22.75V17.875C15.4375 17.6595 15.3519 17.4528 15.1995 17.3005C15.0472 17.1481 14.8405 17.0625 14.625 17.0625H11.375C11.1595 17.0625 10.9528 17.1481 10.8005 17.3005C10.6481 17.4528 10.5625 17.6595 10.5625 17.875V22.75C10.5625 22.9655 10.4769 23.1722 10.3245 23.3245C10.1722 23.4769 9.96549 23.5625 9.75 23.5625H6.09375C5.55503 23.5625 5.03837 23.3485 4.65744 22.9676C4.27651 22.5866 4.0625 22.07 4.0625 21.5312V14.8167C4.0962 14.7866 4.12908 14.7555 4.16108 14.7236L13 5.88467Z"/>
</svg>`;

//Boton de inicio
const botonInicioDiv = document.createElement('div');
botonInicioDiv.classList.add('boton-navegacion-inicio-div');
const botonInicio = document.createElement('button');
botonInicio.type = 'button';
botonInicio.classList.add('boton-navegacion-inicio');
botonInicio.innerHTML = iconoInicio;

//Texto del boton de inicio
const textoBotonInicio = document.createElement('a');
textoBotonInicio.classList.add('texto-boton');
textoBotonInicio.textContent = 'Inicio';
textoBotonInicio.href = '/feed';
marcarBotonActivo(botonInicio, textoBotonInicio.href);
botonInicio.addEventListener('click', () => {
  window.location.href = textoBotonInicio.href;
});

//Renderizacion del boton de inicio
menuHamburguesa.append(botonesNavegacion);
botonesNavegacion.append(botonInicioDiv);
botonInicioDiv.append(botonInicio);
botonInicio.append(textoBotonInicio);


//Logo de Icono de Mensajes
const iconoMensajes = `
<svg class="icono-mensajes" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" d="M1.5 8.67V17.25C1.5 18.0456 1.81607 18.8087 2.37868 19.3713C2.94129 19.9339 3.70435 20.25 4.5 20.25H19.5C20.2956 20.25 21.0587 19.9339 21.6213 19.3713C22.1839 18.8087 22.5 18.0456 22.5 17.25V8.67L13.572 14.163C13.0992 14.4539 12.5551 14.6078 12 14.6078C11.4449 14.6078 10.9008 14.4539 10.428 14.163L1.5 8.67Z"/>
  <path fill="currentColor" d="M22.5 6.908V6.75C22.5 5.95435 22.1839 5.19129 21.6213 4.62868C21.0587 4.06607 20.2956 3.75 19.5 3.75H4.5C3.70435 3.75 2.94129 4.06607 2.37868 4.62868C1.81607 5.19129 1.5 5.95435 1.5 6.75V6.908L11.214 12.886C11.4504 13.0314 11.7225 13.1084 12 13.1084C12.2775 13.1084 12.5496 13.0314 12.786 12.886L22.5 6.908Z"/>
</svg>`;

//Boton de navegacion de Mensajes
//Contenedor de mensajes Div
const botonMensajesDiv = document.createElement('div');
botonMensajesDiv.classList.add('boton-navegacion-mensajes-div');
//Elemento boton de mensajes
const botonMensajes = document.createElement('button');
botonMensajes.type = 'button';
botonMensajes.classList.add('boton-navegacion-mensajes');

//Añadir icono al boton de mensajes
botonMensajes.innerHTML = iconoMensajes;

//Texto del boton de mensajes
const textoBotonMensajes = document.createElement('a');
textoBotonMensajes.classList.add('texto-boton');
textoBotonMensajes.textContent = 'Mensajes';
textoBotonMensajes.href = './mensajes.html';
marcarBotonActivo(botonMensajes, textoBotonMensajes.href);
botonMensajes.addEventListener('click', () => {
  window.location.href = textoBotonMensajes.href;
});

//Renderizacion del boton de mensajes
botonesNavegacion.append(botonMensajesDiv);
botonMensajesDiv.append(botonMensajes);
botonMensajes.append(textoBotonMensajes);


//Logo de Icono de publicaciones 
const iconoPublicaciones = `<svg class="icono-subir" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M5.625 1.5H9C9.99456 1.5 10.9484 1.89509 11.6517 2.59835C12.3549 3.30161 12.75 4.25544 12.75 5.25V7.125C12.75 8.161 13.59 9 14.625 9H16.5C17.4946 9 18.4484 9.39509 19.1517 10.0983C19.8549 10.8016 20.25 11.7554 20.25 12.75V20.625C20.25 21.66 19.41 22.5 18.375 22.5H5.625C5.12772 22.5 4.65081 22.3025 4.29917 21.9508C3.94754 21.5992 3.75 21.1223 3.75 20.625V3.375C3.75 2.339 4.59 1.5 5.625 1.5ZM12.53 11.47C12.3894 11.3295 12.1988 11.2507 12 11.2507C11.8012 11.2507 11.6106 11.3295 11.47 11.47L8.47 14.47C8.39631 14.5387 8.33721 14.6215 8.29622 14.7135C8.25523 14.8055 8.23318 14.9048 8.23141 15.0055C8.22963 15.1062 8.24816 15.2062 8.28588 15.2996C8.3236 15.393 8.37974 15.4778 8.45096 15.549C8.52218 15.6203 8.60701 15.6764 8.7004 15.7141C8.79379 15.7518 8.89382 15.7704 8.99452 15.7686C9.09522 15.7668 9.19454 15.7448 9.28654 15.7038C9.37854 15.6628 9.46134 15.6037 9.53 15.53L11.25 13.81V18C11.25 18.1989 11.329 18.3897 11.4697 18.5303C11.6103 18.671 11.8011 18.75 12 18.75C12.1989 18.75 12.3897 18.671 12.5303 18.5303C12.671 18.3897 12.75 18.1989 12.75 18V13.81L14.47 15.53C14.5387 15.6037 14.6215 15.6628 14.7135 15.7038C14.8055 15.7448 14.9048 15.7668 15.0055 15.7686C15.1062 15.7704 15.2062 15.7518 15.2996 15.7141C15.393 15.6764 15.4778 15.6203 15.549 15.549C15.6203 15.4778 15.6764 15.393 15.7141 15.2996C15.7518 15.2062 15.7704 15.1062 15.7686 15.0055C15.7668 14.9048 15.7448 14.8055 15.7038 14.7135C15.6628 14.6215 15.6037 14.5387 15.53 14.47L12.53 11.47Z"/>
  <path fill="currentColor" d="M14.25 5.25C14.2518 3.98855 13.7975 2.76897 12.971 1.816C14.6443 2.25597 16.1707 3.13248 17.3941 4.35589C18.6175 5.5793 19.494 7.10571 19.934 8.779C18.981 7.95249 17.7615 7.49825 16.5 7.5H14.625C14.5256 7.5 14.4302 7.46049 14.3598 7.39017C14.2895 7.31984 14.25 7.22446 14.25 7.125V5.25Z"/>
</svg>`;

//Boton de navegacion de Publicaciones
//Contenedor de publicaciones Div
const botonPublicacionesDiv = document.createElement('div');
botonPublicacionesDiv.classList.add('boton-navegacion-publicaciones-div');
//Elemento boton de publicacion
const botonPublicaciones = document.createElement('button');
botonPublicaciones.type = 'button';
botonPublicaciones.classList.add('boton-navegacion-publicaciones');

//Añadir icono al boton de publicaciones
botonPublicaciones.innerHTML = iconoPublicaciones;

//Texto del boton de publicaciones
const textoBotonPublicaciones = document.createElement('a');
textoBotonPublicaciones.classList.add('texto-boton');
textoBotonPublicaciones.textContent = 'Publicar';
textoBotonPublicaciones.href = './publicacion.html';
marcarBotonActivo(botonPublicaciones, textoBotonPublicaciones.href);
botonPublicaciones.addEventListener('click', () => {
  window.location.href = textoBotonPublicaciones.href;
});

//Renderizacion del boton de publicaciones
menuHamburguesa.append(botonesNavegacion);
botonesNavegacion.append(botonPublicacionesDiv);
botonPublicacionesDiv.append(botonPublicaciones);
botonPublicaciones.append(textoBotonPublicaciones);



//Icono de perfil
const iconoPerfil = `
<svg class="icono-perfil" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M18.685 19.097C19.654 18.1865 20.426 17.0869 20.9532 15.8662C21.4803 14.6455 21.7515 13.3297 21.75 12C21.75 6.615 17.385 2.25 12 2.25C6.61501 2.25 2.25001 6.615 2.25001 12C2.24847 13.3297 2.51967 14.6455 3.04686 15.8662C3.57404 17.0869 4.346 18.1865 5.31501 19.097C7.12194 20.8039 9.51435 21.7533 12 21.75C14.4857 21.7533 16.8781 20.8039 18.685 19.097ZM6.14501 17.812C6.84708 16.9336 7.73802 16.2247 8.75164 15.7379C9.76527 15.2511 10.8755 14.9989 12 15C13.1245 14.9989 14.2347 15.2511 15.2484 15.7379C16.262 16.2247 17.1529 16.9336 17.855 17.812C17.089 18.5857 16.1771 19.1996 15.172 19.6181C14.1669 20.0366 13.0887 20.2514 12 20.25C10.9113 20.2514 9.83311 20.0366 8.82803 19.6181C7.82296 19.1996 6.91098 18.5857 6.14501 17.812ZM15.75 9C15.75 9.99456 15.3549 10.9484 14.6517 11.6517C13.9484 12.3549 12.9946 12.75 12 12.75C11.0054 12.75 10.0516 12.3549 9.34836 11.6517C8.64509 10.9484 8.25001 9.99456 8.25001 9C8.25001 8.00544 8.64509 7.05161 9.34836 6.34835C10.0516 5.64509 11.0054 5.25 12 5.25C12.9946 5.25 13.9484 5.64509 14.6517 6.34835C15.3549 7.05161 15.75 8.00544 15.75 9Z"/>
</svg>`;

//Boton de Perfil 
const botonPerfilDiv = document.createElement('div');
botonPerfilDiv.classList.add('boton-navegacion-perfil-div');

//Boton de perfil
const botonPerfil = document.createElement('button');
botonPerfil.type = 'button';
botonPerfil.classList.add('boton-navegacion-perfil');
botonPerfil.innerHTML = iconoPerfil;

//Texto del boton de perfil
const textoBotonPerfil = document.createElement('a');
textoBotonPerfil.classList.add('texto-boton');
textoBotonPerfil.textContent = 'Perfil';
textoBotonPerfil.href = './perfil.html';
marcarBotonActivo(botonPerfil, textoBotonPerfil.href);
botonPerfil.addEventListener('click', () => {
  window.location.href = textoBotonPerfil.href;
});


//Renderizacion del boton de perfil
menuHamburguesa.append(botonesNavegacion);
botonesNavegacion.append(botonPerfilDiv);
botonPerfilDiv.append(botonPerfil);
botonPerfil.append(textoBotonPerfil);


  return menuHamburguesa;
}


//LLamar Funciones para renderizar los botones del menu hamburguesa
botonesMenuHamburguesa();
