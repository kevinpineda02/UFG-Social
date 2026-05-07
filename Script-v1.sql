CREATE 
DATABASE UFG_SOCIAL;

USE UFG_SOCIAL;

CREATE TABLE credenciales(
id BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
correo VARCHAR(80) NOT NULL UNIQUE,
contraseña VARCHAR(80) NOT NULL);

CREATE TABLE usuarios(
id BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
id_credenciales BIGINT NOT NULL,
nombre VARCHAR(120) NOT NULL,
nombre_usuario VARCHAR(40),
seguidores INTEGER,
seguidos INTEGER,
foto_perfil TEXT,
fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_usuarios_credenciales
FOREIGN KEY (id_credenciales) REFERENCES credenciales(id) ON DELETE CASCADE
);

CREATE TABLE publicaciones(
id BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
id_usuarios BIGINT NOT NULL,
descripcion TEXT NOT NULL, 
imagen_url TEXT,
video_url TEXT,
me_gusta INTEGER,
comentario TEXT,

CONSTRAINT fk_usuario_publicaciones
FOREIGN KEY (id_usuarios) REFERENCES usuarios(id) ON DELETE CASCADE
);

