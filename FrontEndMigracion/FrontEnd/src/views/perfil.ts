import fotoPorDefecto from '../assets/perfil/perfil.png';
import { API_BASE_URL } from '../core/api/api';
import { obtenerUserId } from '../features/auth/authGuard';
import {
  obtenerCantidadSeguidores,
  obtenerCantidadSeguidos,
} from '../features/usuario/seguimiento.api';
import {
  actualizarFotoPerfil,
  editarUsuario,
  obtenerUsuarioPorId,
  type UserUpdateRequest,
} from '../features/usuario/usuario.api';
import type { UserResponse } from '../features/auth/auth';

const perfilDiv = document.querySelector<HTMLDivElement>('.perfil');

function resolverUrlFoto(url: string | null | undefined): string {
  if (!url) return fotoPorDefecto;
  return url.startsWith('http') || url.startsWith('data:')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function crearImagen(clase: string): HTMLImageElement {
  const imagen = document.createElement('img');
  imagen.className = clase;
  imagen.alt = 'Foto de perfil';
  imagen.src = fotoPorDefecto;
  imagen.onerror = () => {
    imagen.onerror = null;
    imagen.src = fotoPorDefecto;
  };
  return imagen;
}

function crearCampo(
  etiqueta: string,
  nombre: string,
  marcador: string,
  tipo: 'input' | 'textarea' = 'input'
): {
  grupo: HTMLLabelElement;
  control: HTMLInputElement | HTMLTextAreaElement;
} {
  const grupo = document.createElement('label');
  grupo.className = 'campo-perfil';
  const titulo = document.createElement('span');
  titulo.className = 'titulo-campo-perfil';
  titulo.textContent = etiqueta;
  const control = document.createElement(tipo);
  control.name = nombre;
  control.placeholder = marcador;
  grupo.append(titulo, control);
  return { grupo, control };
}

function mostrarEstado(elemento: HTMLElement, mensaje: string, error = false): void {
  elemento.textContent = mensaje;
  elemento.className = `estado-perfil${error ? ' estado-error' : ''}`;
}

function renderizar(usuario: UserResponse, seguidores: number, seguidos: number): void {
  if (!perfilDiv) return;

  const pagina = document.createElement('main');
  pagina.className = 'contenido-perfil';
  const encabezado = document.createElement('header');
  encabezado.className = 'encabezado-perfil';
  const titulo = document.createElement('h1');
  titulo.textContent = 'Ajustes de Perfil';
  encabezado.append(titulo);

  const panel = document.createElement('section');
  panel.className = 'panel-perfil';
  const resumen = document.createElement('aside');
  resumen.className = 'resumen-perfil';
  const fotoResumen = crearImagen('foto-resumen');
  fotoResumen.src = resolverUrlFoto(usuario.profilePhoto);
  const nombreResumen = document.createElement('strong');
  nombreResumen.textContent = usuario.name || usuario.username;
  const usuarioResumen = document.createElement('span');
  usuarioResumen.textContent = `@${usuario.username}`;
  const estadisticas = document.createElement('div');
  estadisticas.className = 'estadisticas-perfil';
  estadisticas.innerHTML = `<span><b>Seguidores:</b><strong>${seguidores}</strong></span>
    <span><b>Seguidos:</b><strong>${seguidos}</strong></span>`;
  const tituloDescripcion = document.createElement('span');
  tituloDescripcion.className = 'titulo-descripcion-resumen';
  tituloDescripcion.textContent = 'Descripción:';
  const descripcionResumen = document.createElement('p');
  descripcionResumen.className = 'descripcion-resumen';
  descripcionResumen.textContent = usuario.description || 'Sin descripción.';
  resumen.append(
    fotoResumen,
    nombreResumen,
    usuarioResumen,
    estadisticas,
    tituloDescripcion,
    descripcionResumen
  );

  const formulario = document.createElement('form');
  formulario.className = 'formulario-perfil';
  const tituloFormulario = document.createElement('h2');
  tituloFormulario.textContent = 'Modificar Perfil';
  const fotoEditar = crearImagen('foto-editar');
  fotoEditar.src = resolverUrlFoto(usuario.profilePhoto);
  const selectorFoto = document.createElement('input');
  selectorFoto.type = 'file';
  selectorFoto.accept = 'image/*';
  selectorFoto.hidden = true;
  const botonFoto = document.createElement('button');
  botonFoto.type = 'button';
  botonFoto.className = 'boton-foto';
  botonFoto.textContent = 'Cambiar Foto';
  botonFoto.addEventListener('click', () => selectorFoto.click());
  selectorFoto.addEventListener('change', () => {
    const archivo = selectorFoto.files?.[0];
    if (archivo) fotoEditar.src = URL.createObjectURL(archivo);
  });

  const campos = document.createElement('div');
  campos.className = 'campos-perfil';
  const campoNombre = crearCampo('Nombre completo:', 'name', 'Escribe tu nombre completo');
  const campoUsername = crearCampo('Nombre de usuario:', 'username', 'Escribe tu nombre de usuario');
  const campoCarrera = crearCampo('Carrera universitaria:', 'carrera', 'Escribe tu carrera');
  const campoDescripcion = crearCampo(
    'Descripción personal:',
    'description',
    'Escribe una descripción sobre ti',
    'textarea'
  );
  const nombre = campoNombre.control as HTMLInputElement;
  const username = campoUsername.control as HTMLInputElement;
  const carrera = campoCarrera.control as HTMLInputElement;
  const descripcion = campoDescripcion.control as HTMLTextAreaElement;
  nombre.required = true;
  username.required = true;
  nombre.value = usuario.name ?? '';
  username.value = usuario.username ?? '';
  carrera.value = usuario.carrera ?? '';
  descripcion.value = usuario.description ?? '';
  campos.append(
    campoNombre.grupo,
    campoUsername.grupo,
    campoCarrera.grupo,
    campoDescripcion.grupo
  );

  const estado = document.createElement('p');
  estado.className = 'estado-perfil';
  estado.setAttribute('role', 'status');
  const acciones = document.createElement('div');
  acciones.className = 'acciones-perfil';
  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.className = 'boton-secundario';
  cancelar.textContent = 'Cancelar Cambios';
  cancelar.addEventListener('click', () => {
    nombre.value = usuario.name ?? '';
    username.value = usuario.username ?? '';
    carrera.value = usuario.carrera ?? '';
    descripcion.value = usuario.description ?? '';
    selectorFoto.value = '';
    fotoEditar.src = resolverUrlFoto(usuario.profilePhoto);
    mostrarEstado(estado, '');
  });
  const guardar = document.createElement('button');
  guardar.type = 'submit';
  guardar.className = 'boton-principal';
  guardar.textContent = 'Guardar Cambios';
  acciones.append(cancelar, guardar);

  formulario.append(tituloFormulario, fotoEditar, selectorFoto, botonFoto, campos, estado, acciones);
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const userId = obtenerUserId();
    if (userId === null) return;
    guardar.disabled = true;
    cancelar.disabled = true;
    mostrarEstado(estado, 'Guardando cambios...');
    try {
      const datosActualizacion: UserUpdateRequest = {
        id: usuario.id,
        credentialId: usuario.credentialId,
        name: nombre.value.trim(),
        username: username.value.trim(),
        followers: usuario.followers,
        followed: usuario.followed,
        profilePhoto: usuario.profilePhoto,
        carrera: carrera.value.trim(),
        description: descripcion.value.trim(),
        creationDate: usuario.creationDate,
      };
      const actualizado = await editarUsuario(userId, datosActualizacion);
      const archivo = selectorFoto.files?.[0];
      const final = archivo ? await actualizarFotoPerfil(userId, archivo) : actualizado;
      usuario = final;
      nombreResumen.textContent = final.name || final.username;
      usuarioResumen.textContent = `@${final.username}`;
      fotoResumen.src = resolverUrlFoto(final.profilePhoto);
      fotoEditar.src = resolverUrlFoto(final.profilePhoto);
      selectorFoto.value = '';
      window.location.reload();
    } catch (error) {
      console.error('No se pudo actualizar el perfil:', error);
      mostrarEstado(estado, 'No se pudieron guardar los cambios.', true);
    } finally {
      guardar.disabled = false;
      cancelar.disabled = false;
    }
  });

  panel.append(resumen, formulario);
  pagina.append(encabezado, panel);
  perfilDiv.querySelector('.contenido-perfil')?.remove();
  perfilDiv.append(pagina);
}

async function iniciarPerfil(): Promise<void> {
  const userId = obtenerUserId();
  if (!perfilDiv || userId === null) return;
  const estado = document.createElement('p');
  estado.className = 'estado-carga-perfil';
  estado.textContent = 'Cargando perfil...';
  perfilDiv.append(estado);
  try {
    const [usuario, seguidores, seguidos] = await Promise.all([
      obtenerUsuarioPorId(userId),
      obtenerCantidadSeguidores(userId),
      obtenerCantidadSeguidos(userId),
    ]);
    estado.remove();
    renderizar(usuario, seguidores, seguidos);
  } catch (error) {
    console.error('No se pudo cargar el perfil:', error);
    estado.textContent = 'No se pudo cargar el perfil. Intenta nuevamente.';
    estado.className = 'estado-carga-perfil estado-error';
  }
}

void iniciarPerfil();
