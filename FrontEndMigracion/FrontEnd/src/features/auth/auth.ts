import fotoPorDefecto from '../../assets/perfil/perfil.png';
import { API_BASE_URL } from '../../core/api/api';

const FOTO_PERFIL_POR_DEFECTO = new URL(fotoPorDefecto, window.location.origin).href;

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export type RegistroRequest = LoginRequest;

export const ROL = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

export interface AuthResponse {
  token: string;
  credentialId: number;
  userId: number | null;
  rol: Rol | null;
}

export interface UserRequest {
  id?: number;
  credentialId: number;
  name: string;
  username: string;
  followers?: number;
  followed?: number;
  profilePhoto: string;
  creationDate?: string;
}

export type UserResponse = Required<UserRequest>;

export interface RegistroCompleto {
  nombre: string;
  nombreUsuario: string;
  correo: string;
  contrasena: string;
}

export interface ResultadoRegistro {
  auth: AuthResponse;
  usuario: UserResponse | null;
}

async function manejarRespuesta<T>(response: Response, mensaje: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${mensaje} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function iniciarSesion(datos: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<AuthResponse>(response, 'Correo o contraseña incorrectos');
}

async function crearCredencial(registro: RegistroRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(registro),
  });
  return manejarRespuesta<AuthResponse>(response, 'No se pudo crear la cuenta');
}

async function crearUsuario(user: UserRequest, token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });
  return manejarRespuesta<UserResponse>(response, 'No se pudo crear el perfil');
}

export async function registrarse(datos: RegistroCompleto): Promise<ResultadoRegistro> {
  const auth = await crearCredencial({
    correo: datos.correo,
    contrasena: datos.contrasena,
  });

  try {
    const usuario = await crearUsuario(
      {
        credentialId: auth.credentialId,
        name: datos.nombre,
        username: datos.nombreUsuario,
        profilePhoto: FOTO_PERFIL_POR_DEFECTO,
      },
      auth.token,
    );
    return { auth, usuario };
  } catch (error) {
    console.error('Falló el paso 2 (/user):', error);
    return { auth, usuario: null };
  }
}

