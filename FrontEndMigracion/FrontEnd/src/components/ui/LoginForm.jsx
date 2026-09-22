import React from 'react';
import '../../styles/Login.css';
import BotonTema from './BotonTema';

export const LoginForm = () => {
  // Estado que controla qué formulario se muestra: 'login' | 'registro' | 'recuperar'
  const [vista, setVista] = React.useState('login');

  // Cambia de vista sin que el enlace recargue la página
  const irA = (nuevaVista) => (e) => {
    e.preventDefault();
    setVista(nuevaVista);
  };

  const handleLogin = (e) => {
    e.preventDefault();
  };

  const handleRegistro = (e) => {
    e.preventDefault();
  };

  const handleRecuperar = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <BotonTema />

      {/* Formulario de Inicio de Sesión */}
      <form
        className="formulario-login"
        hidden={vista !== 'login'}
        onSubmit={handleLogin}
      >
        <div className="contenido">
          <h2 className="titulo">UFG</h2>
          <span className="subtitulo">Iniciar sesión</span>
          <div className="inputs">
            <label htmlFor="login-usuario">Correo electrónico</label>
            <input id="login-usuario" type="email" placeholder="Usuario" />
            <label htmlFor="login-contraseña">Contraseña</label>
            <input id="login-contraseña" type="password" placeholder="Contraseña" />
          </div>
          <div className="vistas">
            <div className="recuperar">
              <label>
                ¿Olvidaste tu contraseña?{' '}
                <a href="#" onClick={irA('recuperar')}>Recupérala aquí</a>
              </label>
            </div>
          </div>
          <div className="botones">
            <button className="boton-iniciar-sesion" type="submit">
              Iniciar sesión
            </button>
            <div className="registrar">
              <label>
                ¿No tienes cuenta?{' '}
                <a href="#" onClick={irA('registro')}>Regístrate aquí</a>
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Formulario de Registro */}
      <form
        className="formulario-registro"
        hidden={vista !== 'registro'}
        onSubmit={handleRegistro}
      >
        <div className="contenido">
          <h2 className="titulo">UFG</h2>
          <span className="subtitulo">Crear Cuenta</span>
          <div className="inputs">
            <label htmlFor="registro-usuario">Correo electrónico</label>
            <input id="registro-usuario" type="email" placeholder="Usuario" />
            <label htmlFor="registro-contraseña">Contraseña</label>
            <input id="registro-contraseña" type="password" placeholder="Contraseña" />
            <label htmlFor="registro-confirmar">Confirmar Contraseña</label>
            <input id="registro-confirmar" type="password" placeholder="Confirmar Contraseña" />
          </div>
          <div className="vistas"></div>
          <div className="botones">
            <button className="boton-iniciar-sesion" type="submit">
              Registrarse
            </button>
            <div className="registrar">
              <label>
                ¿Ya tienes cuenta?{' '}
                <a href="#" onClick={irA('login')}>Inicia sesión aquí</a>
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Formulario de Recuperar Contraseña */}
      <form
        className="formulario-recuperar"
        hidden={vista !== 'recuperar'}
        onSubmit={handleRecuperar}
      >
        <div className="contenido">
          <h2 className="titulo">UFG</h2>
          <span className="subtitulo">Recuperar Contraseña</span>
          <div className="inputs">
            <label htmlFor="recuperar-email">Correo electrónico</label>
            <input id="recuperar-email" type="email" placeholder="Correo electrónico" />
          </div>
          <div className="botones">
            <button className="boton-iniciar-sesion" type="submit">
              Recuperar
            </button>
            <div className="registrar">
              <label>
                <a href="#" onClick={irA('login')}>Volver al inicio de sesión</a>
              </label>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};