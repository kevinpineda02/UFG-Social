export function cambiarFormulario(): void {
  const formRegistro = document.querySelector<HTMLElement>('.formulario-registro');
  const formIniciarSesion = document.querySelector<HTMLElement>('.formulario-login');
  const btnRegistrarse = document.querySelector<HTMLAnchorElement>('#registrarse');
  const btnIniciarSesion = document.querySelector<HTMLAnchorElement>('#iniciar-sesion');

  if (!formRegistro || !formIniciarSesion || !btnRegistrarse || !btnIniciarSesion) {
    console.warn('No se encontraron los controles para cambiar de formulario.');
    return;
  }

  let registroVisible = false;
  const mostrarFormulario = (mostrarRegistro: boolean): void => {
    registroVisible = mostrarRegistro;
    formIniciarSesion.style.display = registroVisible ? 'none' : 'flex';
    formRegistro.style.display = registroVisible ? 'flex' : 'none';
  };

  btnRegistrarse.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrarFormulario(true);
  });

  btnIniciarSesion.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrarFormulario(false);
  });
}


