import { RUTA_FEED, RUTA_LOGIN, TOKEN_KEY, USER_ID_KEY } from '../../core/constantes';

// ---------- Manejo del token ----------
export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ---------- Manejo del userId ----------
export function guardarUserId(id: number): void {
  localStorage.setItem(USER_ID_KEY, String(id));
}

export function limpiarUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}

export function obtenerUserId(): number | null {
  const id = localStorage.getItem(USER_ID_KEY);
  if (!id) return null;

  const numero = Number(id);
  return Number.isNaN(numero) ? null : numero;
}

export function limpiarSesion(): void {
  localStorage.removeItem(TOKEN_KEY);
  limpiarUserId();
}

export function cerrarSesion(): void {
  limpiarSesion();
  window.location.replace(RUTA_LOGIN);
}

// ---------- Validación del token ----------
function tokenExpirado(token: string): boolean {
  try {
    const partes = token.split('.');
    if (partes.length < 2) return true;

    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64));

    if (!esPayloadJwt(payload) || typeof payload.exp !== 'number') return false;

    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('No se pudo comprobar la sesión:', error);
    return true;
  }
}

function esPayloadJwt(payload: unknown): payload is { exp?: number } {
  return typeof payload === 'object' && payload !== null;
}

export function haySesionValida(): boolean {
  const token = obtenerToken();
  if (!token) return false;

  if (tokenExpirado(token)) {
    limpiarSesion();
    return false;
  }
  return true;
}

// ---------- Guards ----------

// Para páginas protegidas (feed, perfil, etc.)
export function verificarSesion(): void {
  if (!haySesionValida() || obtenerUserId() === null) {
    limpiarSesion();
    window.location.replace(RUTA_LOGIN);
  }
}

// Para login y registro: si ya hay sesión, redirige al feed
export function redirigirSiAutenticado(): void {
  if (haySesionValida() && obtenerUserId() !== null) {
    window.location.replace(RUTA_FEED);
  }
}