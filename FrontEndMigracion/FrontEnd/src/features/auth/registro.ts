import { registrarse } from './auth';
import { guardarToken } from './authGuard';
import { PATRON_CONTRASENA, RUTA_FEED } from '../../core/constantes';

export function initRegistro(): void {
  const form = document.querySelector<HTMLFormElement>('.form-registro');
  if (!form) {
    console.warn('No se encontró el formulario de registro.');
    return;
  }

  // Selectores relativos al formulario de registro
  const inputNombre = form.querySelector<HTMLInputElement>('#usuario');
  const inputUsuario = form.querySelector<HTMLInputElement>('#nombreUsuario');
  const inputCorreo = form.querySelector<HTMLInputElement>('#correo');
  const inputContrasena = form.querySelector<HTMLInputElement>('#contrasena');
  const inputConfirmar = form.querySelector<HTMLInputElement>('#confirmar-contrasena');
  const boton = form.querySelector<HTMLButtonElement>('.boton-registrarse');

  if (!inputNombre || !inputUsuario || !inputCorreo || !inputContrasena || !inputConfirmar || !boton) {
    console.warn('Faltan controles en el formulario de registro.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const nombreUsuario = inputUsuario.value.trim();
    const correo = inputCorreo.value.trim();
    const contrasena = inputContrasena.value;
    const confirmar = inputConfirmar.value;

    if (contrasena !== confirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!PATRON_CONTRASENA.test(contrasena)) {
      alert('La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial (@ $ ! % * ? &)');
      return;
    }

    boton.disabled = true;
    try {
      const { auth } = await registrarse({ nombre, nombreUsuario, correo, contrasena });
      guardarToken(auth.token);
      window.location.replace(RUTA_FEED);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al registrarse');
    } finally {
      boton.disabled = false;
    }
  });
}