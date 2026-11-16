import { iniciarTema } from './core/tema';
import { cambiarFormulario } from './core/cambioForm';
import { initLogin } from './features/auth/login';
import { initRegistro } from './features/auth/registro';
import { verificarAccesoDeRuta } from './features/auth/authGuard';


(async (): Promise<void> => {
  if (!verificarAccesoDeRuta()) {
    return;
  }

  const [{ feedGeneral }, { verificarSesion }, { menuSolicitudes }] = await Promise.all([
    import('./views/feedGeneral'),
    import('./features/auth/authGuard'),
    import('./views/menuHamburgesa'),
    import('./views/publicar'),
    import('./views/sugerencia'),
  ]).then(([feedModule, authModule, , , sugerenciaModule]) =>
    [feedModule, authModule, sugerenciaModule] as const);

  if (document.querySelector('.feed')) {
    verificarSesion();
    void feedGeneral();
  }

  if (document.querySelector('.solicitudes')) {
    void menuSolicitudes();
  }

  if (document.querySelector('.perfil')) {
    await import('./views/perfil');
  }

  if (document.querySelector('.seguidores')) {
    await import('./views/seguidores');
  }

  iniciarTema('tema');
  cambiarFormulario();
  initLogin();
  initRegistro();
})();
