import { iniciarTema } from './core/tema';
import { cambiarFormulario } from './core/cambioForm';
import { initLogin } from './features/auth/login';
import { initRegistro } from './features/auth/registro';
import { verificarAccesoDeRuta } from './features/auth/authGuard';

(async (): Promise<void> => {
  if (!verificarAccesoDeRuta()) {
    return;
  }

  const [{ feedGeneral }, { verificarSesion }] = await Promise.all([
    import('./components/feedGeneral'),
    import('./features/auth/authGuard'),
    import('./components/menuHamburgesa'),
    import('./components/publicar'),
  ]).then(([feedModule, authModule]) => [feedModule, authModule] as const);

  if (document.querySelector('.feed')) {
    verificarSesion();
    void feedGeneral();
  }

  iniciarTema('tema');
  cambiarFormulario();
  initLogin();
  initRegistro();
})();
