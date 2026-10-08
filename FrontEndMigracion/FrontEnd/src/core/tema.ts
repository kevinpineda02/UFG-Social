const claveTema = 'tema';
const claseClaro = 'modo-claro';

type Tema = 'oscuro' | 'claro';

// Guardamos el ID del botón para actualizar su icono globalmente
let idBotonActivo = 'tema';

// SVGs minimalistas (puedes reemplazarlos por los tuyos si prefieres otros estilos)
const iconoSol = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const iconoLuna = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

// Aplica el tema al <html>, actualiza el icono y guarda para la próxima visita
export function aplicarTema(tema: Tema): void {
  document.documentElement.classList.toggle(claseClaro, tema === 'claro');

  // Inyectamos el SVG correspondiente dentro del botón
  const boton = document.getElementById(idBotonActivo);
  if (boton) {
    boton.innerHTML = tema === 'claro' ? iconoSol : iconoLuna;
  }

  try {
    localStorage.setItem(claveTema, tema);
  } catch {
    // Si el almacenamiento está bloqueado, el tema igual se aplica
  }
}

// Devuelve el tema guardado, o el del sistema si es la primera vez
function obtenerTemaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(claveTema) as Tema | null;
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch {
    // ignorar
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'claro'
    : 'oscuro';
}

// Cambia entre oscuro y claro
export function alternarTema(): void {
  const esClaro = document.documentElement.classList.contains(claseClaro);
  aplicarTema(esClaro ? 'oscuro' : 'claro');
}

// Se llama una sola vez al arrancar la app
export function iniciarTema(botonId = 'tema'): void {
  idBotonActivo = botonId; // Registramos el ID antes de aplicar el tema inicial
  aplicarTema(obtenerTemaInicial());

  const boton = document.getElementById(botonId);
  boton?.addEventListener('click', alternarTema);
}