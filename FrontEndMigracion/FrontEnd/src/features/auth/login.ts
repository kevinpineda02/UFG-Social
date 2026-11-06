import { iniciarSesion } from './auth';
import { guardarRol, guardarToken, guardarUserId, limpiarSesion, redirigirSiAutenticado } from './authGuard';
import { RUTA_FEED } from '../../core/constantes';

export function initLogin(): void {
  const form = document.querySelector<HTMLFormElement>('.form-login');
  if (!form) {
    return;
  }

  redirigirSiAutenticado();

  // Se busca dentro del formulario de login, no en todo el documento
  const inputCorreo = form.querySelector<HTMLInputElement>('#nombreUsuario');
  const inputContrasena = form.querySelector<HTMLInputElement>('#contrasena');
  const boton = form.querySelector<HTMLButtonElement>('.boton-iniciar-sesion');

  if (!inputCorreo || !inputContrasena || !boton) {
    console.warn('Faltan controles en el formulario de inicio de sesión.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = inputCorreo.value.trim();
    const contrasena = inputContrasena.value;

    boton.disabled = true;
    try {
      const auth = await iniciarSesion({ correo, contrasena });
      if (auth.userId === null) {
        limpiarSesion();
        throw new Error('La respuesta de inicio de sesión no contiene el ID del usuario');
      }

      guardarToken(auth.token);
      guardarUserId(auth.userId);
      guardarRol(auth.rol);

      window.location.replace(RUTA_FEED);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      boton.disabled = false;
    }
  });
}