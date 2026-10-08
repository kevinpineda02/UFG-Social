import { iniciarTema } from './core/tema';
import { cambiarFormulario } from './core/cambioForm';
import { initLogin } from './features/auth/login';
import { initRegistro } from './features/auth/registro';

iniciarTema('tema');
cambiarFormulario();
initLogin(); // ya incluye redirigirSiAutenticado()
initRegistro();