import { iniciarTema } from './core/tema';
import { cambiarFormulario } from './core/cambioForm';
import { initLogin } from './features/auth/login';
import { initRegistro } from './features/auth/registro';
import { verificarSesion } from './features/auth/authGuard';
import './components/menuHamburgesa';
import { feedGeneral } from './components/feedGeneral';


if (document.querySelector('.feed')) {
  verificarSesion();
  feedGeneral();
}

iniciarTema('tema');
cambiarFormulario();
initLogin();
initRegistro();
