import { iniciarSesion } from './auth';
import { guardarToken, redirigirSiAutenticado } from './authGuard';
import { RUTA_FEED } from '../../core/constantes';

export function initLogin(): void {
  redirigirSiAutenticado();

  const form = document.querySelector<HTMLFormElement>('.form-login');
  if (!form) {
    console.warn('No se encontró el formulario de inicio de sesión.');
    return;
  }

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
      guardarToken(auth.token);
      window.location.replace(RUTA_FEED);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      boton.disabled = false;
    }
  });
}