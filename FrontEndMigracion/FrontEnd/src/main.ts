import { iniciarTema } from './core/tema';
import { cambiarFormulario } from './core/cambioForm';
import { initLogin } from './features/auth/login';
import { initRegistro } from './features/auth/registro';
import { verificarSesion } from './features/auth/authGuard';
import './components/menuHamburgesa';


if (document.querySelector('.feed')) {
  verificarSesion();
}

iniciarTema('tema');
cambiarFormulario();
initLogin();
initRegistro();