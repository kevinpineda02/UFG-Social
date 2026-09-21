import React from 'react'
import '../../styles/Login.css';

export const LoginForm = () => {
  return (
    <>
    <form className='formulario-login'>
    <div className='contenido'>
    <h2 className='titulo'>UFG</h2>
    <span className="subtitulo">Iniciar sesión</span>
    <div className="inputs">
      <label htmlFor="usuario">Correo electrónico</label>
      <input type="text" placeholder="Usuario" /> 
      <label htmlFor="contraseña">Contraseña</label>
      <input type="password" placeholder="Contraseña" />
    </div>
    <div className="vistas">
      <div className="recuperar">
        <label htmlFor="recuperar">¿Olvidaste tu contraseña? <a>Recuperala aquí</a></label>
      </div>
    </div>
    <div className="botones">
      <button className="boton-iniciar-sesion" type="submit">Iniciar sesión</button>
      <div className="registrar"><label htmlFor="registrar">¿No tienes cuenta? <a>Regístrate aquí</a></label></div>
    </div>
    </div>
    </form>
    </>
  )
}
