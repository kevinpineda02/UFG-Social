/**
 * Script principal para la Funciónonalidad de HomeNew
 *
 * @author Kevin Pineda
 * @license KevinPineda
 * @copyright © 2025 Kevin Pineda. Todos los derechos reservados.
 */

// ===========================================
// CONFIGURACIóN DE LA API BACKEND
// ===========================================

const API_BASE_URL = "http://127.0.0.1:8081/api";
const API_ENDPOINTS = {
  // Verificación de salud del backend
  health: `${API_BASE_URL}/health`,

  // Publicaciones
  publicaciones: `${API_BASE_URL}/publicaciones`,

  // Usuario (gestión de perfil)
  usuario: `${API_BASE_URL}/usuario`,
};

// Estado de conexión con el backend
let backendConectado = false;
let usarBackend = true; // Cambiar a false para usar solo localStorage

// ===========================================
// FunciónONES DE API BACKEND
// ===========================================

// Verificar conexión con el backend
async function verificarConexionBackend() {
  try {
    const response = await fetch(API_ENDPOINTS.health, {
      method: "GET",
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      backendConectado = true;
      console.log("✅ Backend conectado:", data.message);
      return true;
    }
  } catch (error) {
    console.warn(
      "⚠️ Backend no disponible, usando localStorage:",
      error.message,
    );
    backendConectado = false;
    return false;
  }
}

// Obtener todas las publicaciones del backend
async function obtenerPublicacionesBackend() {
  try {
    const response = await fetch(API_ENDPOINTS.publicaciones);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error obteniendo publicaciones del backend:", error);
    return [];
  }
}

// Crear publicación en el backend
async function crearPublicacionBackend(
  contenido,
  imagen = null,
  categoria = "general",
  etiquetas = [],
) {
  try {
    const datosUsuario = obtenerDatosUsuario();
    const formData = new FormData();

    formData.append("contenido", contenido);
    formData.append("autorUsername", datosUsuario.username);
    formData.append("autorHandle", datosUsuario.handle);
    formData.append("autorAvatar", datosUsuario.avatar);
    formData.append("categoria", categoria);
    formData.append("etiquetas", JSON.stringify(etiquetas));

    if (imagen) {
      formData.append("imagen", imagen);
    }

    const response = await fetch(API_ENDPOINTS.publicaciones, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error creando publicación en backend:", error);
    return null;
  }
}

// Dar like a una publicación en el backend
async function darLikeBackend(publicacionId) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.publicaciones}/${publicacionId}/like`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error dando like en backend:", error);
    return null;
  }
}

// Quitar like a una publicación en el backend
async function quitarLikeBackend(publicacionId) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.publicaciones}/${publicacionId}/like`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error quitando like en backend:", error);
    return null;
  }
}

// Agregar comentario en el backend
async function AgregarComentarioBackend(publicacionId, contenido) {
  try {
    const datosUsuario = obtenerDatosUsuario();

    const response = await fetch(
      `${API_ENDPOINTS.publicaciones}/${publicacionId}/comentarios`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contenido: contenido,
          autorUsername: datosUsuario.username,
          autorHandle: datosUsuario.handle,
          autorAvatar: datosUsuario.avatar,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error agregando comentario en backend:", error);
    return null;
  }
}

// Eliminar publicación en el backend
async function eliminarPublicacionBackend(publicacionId) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.publicaciones}/${publicacionId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error eliminando publicación en backend:", error);
    return false;
  }
}

// ===========================================
// FunciónONES HíBRIDAS (BACKEND + LOCALSTORAGE)
// ===========================================

// Función híbrida para obtener publicaciones
async function obtenerPublicacionesHybrid() {
  // Siempre usar backend, sin fallback a localStorage
  console.log("📡 Obteniendo publicaciones del backend...");
  return await obtenerPublicacionesBackend();
}

// Función para obtener publicaciones de localStorage (método existente)
function obtenerPublicacionesLocalStorage() {
  try {
    const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
    if (!publicacionesGuardadas) {
      return [];
    }
    const publicaciones = JSON.parse(publicacionesGuardadas);

    // Extraer y sincronizar comentarios de cada publicación
    publicaciones.forEach((pub) => {
      if (pub.comentarios && pub.comentarios.length > 0) {
        // Sincronizar con el objeto global de comentarios
        comentariosPorPublicacion[pub.id] = [...pub.comentarios];
        console.log(
          `📦 Comentarios extraídos para ${pub.id}:`,
          pub.comentarios.length,
        );
      }

      // Si la publicación tiene datos completos, restaurar también
      if (pub.datosCompletos && pub.datosCompletos.comentarios) {
        comentariosPorPublicacion[pub.id] = [...pub.datosCompletos.comentarios];
        console.log(
          `📦 Comentarios completos restaurados para ${pub.id}:`,
          pub.datosCompletos.comentarios.length,
        );
      }
    });

    console.log("📋 Comentarios sincronizados desde publicaciones guardadas");

    return publicaciones.sort(
      (a, b) =>
        new Date(b.timestamp || b.fechaCreacion) -
        new Date(a.timestamp || a.fechaCreacion),
    );
  } catch (error) {
    console.error("Error obteniendo publicaciones de localStorage:", error);
    return [];
  }
}

// ===========================================
// FunciónONES AUXILIARES PARA BACKEND
// ===========================================

// Función para inicializar el backend
async function inicializarBackend() {
  console.log("🔄 Inicializando conexión con backend...");

  // Verificar si el backend está disponible
  await verificarConexionBackend();

  if (backendConectado) {
    console.log("✅ Backend disponible, consumiendo datos desde backend");
  } else {
    console.error(
      "❌ Backend no disponible, la aplicación requiere conexión al backend",
    );
    mostrarNotificacion("Error: No se pudo conectar al backend", "error");
  }

  // Cargar publicaciones
  await cargarPublicaciones();
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = "info") {
  console.log(`${tipo.toUpperCase()}: ${mensaje}`);

  // Crear notificación visual simple
  const notificacion = document.createElement("div");
  notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

  // Colores según el tipo
  const colores = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
  };

  notificacion.style.backgroundColor = colores[tipo] || colores.info;
  notificacion.textContent = mensaje;

  document.body.appendChild(notificacion);

  // Mostrar con animación
  setTimeout(() => {
    notificacion.style.opacity = "1";
  }, 10);

  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.style.opacity = "0";
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Función para calcular tiempo transcurrido
function tiempoTranscurrido(fecha) {
  const ahora = new Date();
  const fechaPublicacion = new Date(fecha);
  const diferencia = Math.floor((ahora - fechaPublicacion) / 1000);

  if (diferencia < 60) {
    return "hace unos segundos";
  } else if (diferencia < 3600) {
    const minutos = Math.floor(diferencia / 60);
    return `hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  } else if (diferencia < 86400) {
    const horas = Math.floor(diferencia / 3600);
    return `hace ${horas} hora${horas > 1 ? "s" : ""}`;
  } else {
    const dias = Math.floor(diferencia / 86400);
    return `hace ${dias} día${dias > 1 ? "s" : ""}`;
  }
}

// ===========================================
// FunciónONES ORIGINALES
// ===========================================

const AVATAR_POR_DEFECTO = "./assets/Logo/LogoAzul.jpg";

function normalizarAvatar(avatar) {
  if (!avatar) return AVATAR_POR_DEFECTO;

  const avatarNormalizado = String(avatar).trim();
  const esRutaLegacy =
    avatarNormalizado.includes("/HomeNew/") ||
    avatarNormalizado.includes("/publicaciones/");
  const esBase64 = avatarNormalizado.startsWith("data:image/");

  if (esRutaLegacy || esBase64) {
    return AVATAR_POR_DEFECTO;
  }

  return avatarNormalizado;
}

// Función para obtener datos del usuario desde el backend (currentUser)
function obtenerDatosUsuario() {
  // Obtener usuario del sistema de autenticación (auth.js)
  const usuario = getCurrentUser && getCurrentUser();

  // Si hay usuario autenticado, usarlo
  if (usuario) {
    return {
      username: usuario.username || usuario.name || "Usuario",
      handle: `@${(usuario.username || usuario.name || "usuario").toLowerCase().replace(/\s+/g, "")}`,
      avatar: usuario.profilePhoto || AVATAR_POR_DEFECTO,
    };
  }

  // Si no hay usuario logueado, usar valores predeterminados
  console.warn("⚠️ No hay usuario autenticado");
  return {
    username: "Invitado",
    handle: "@invitado",
    avatar: AVATAR_POR_DEFECTO,
  };
}

// Variables globales para el carrusel
let slideActual = 0;
let totalSlides = 0;

// Sistema de persistencia de publicaciones
const STORAGE_KEY = "gnet_publicaciones";

// Función para guardar publicaciones en localStorage
function guardarPublicaciones() {
  try {
    const publicaciones = [];
    const contenedores = document.querySelectorAll(
      ".feed-publicaciones .contenedor-publicacion",
    );

    contenedores.forEach((contenedor) => {
      const publicacion = contenedor.querySelector(".publicacion");
      if (
        !publicacion ||
        publicacion.id === "pub_ejemplo_1" ||
        publicacion.id === "pub_ejemplo_2"
      ) {
        return; // No guardar publicaciones de ejemplo
      }

      // Obtener el timestamp original si existe, sino crear uno nuevo
      let timestampOriginal = publicacion.dataset.timestamp;
      if (!timestampOriginal) {
        timestampOriginal = Date.now();
        publicacion.dataset.timestamp = timestampOriginal;
      }

      // Obtener datos completos de la publicación incluyendo comentarios
      let datosPublicacionCompleta = null;
      try {
        if (publicacion.dataset.publicacionCompleta) {
          datosPublicacionCompleta = JSON.parse(
            publicacion.dataset.publicacionCompleta,
          );
          // Sincronizar comentarios actuales del objeto global
          if (comentariosPorPublicacion[publicacion.id]) {
            datosPublicacionCompleta.comentarios = [
              ...comentariosPorPublicacion[publicacion.id],
            ];
          }
        }
      } catch (error) {
        console.warn("Error al parsear datos de publicación:", error);
      }

      // Crear una copia limpia del HTML sin atributos temporales
      const contenedorClon = contenedor.cloneNode(true);

      // Limpiar estilos temporales de animaciones pero preservar el contenido
      const elementosConEstilo = contenedorClon.querySelectorAll("[style]");
      elementosConEstilo.forEach((el) => {
        const estilo = el.style.cssText;
        if (
          estilo.includes("opacity: 0") ||
          estilo.includes("transform:") ||
          estilo.includes("transition:")
        ) {
          el.removeAttribute("style");
        }
      });

      const datos = {
        id: publicacion.id,
        html: contenedorClon.innerHTML,
        timestamp: parseInt(timestampOriginal),
        // Incluir datos completos de la publicación con comentarios empaquetados
        datosCompletos: datosPublicacionCompleta,
        // Extraer comentarios actuales para mantener sincronización
        comentarios: comentariosPorPublicacion[publicacion.id] || [],
      };

      publicaciones.push(datos);
    });

    // Limitar el número de publicaciones guardadas para evitar problemas de memoria
    const MAX_PUBLICACIONES = 50;
    if (publicaciones.length > MAX_PUBLICACIONES) {
      // Mantener solo las más recientes
      publicaciones.sort((a, b) => b.timestamp - a.timestamp);
      publicaciones.splice(MAX_PUBLICACIONES);
      console.warn(
        `Publicaciones limitadas a ${MAX_PUBLICACIONES} para optimizar el rendimiento`,
      );
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(publicaciones));
    console.log("💾 Publicaciones guardadas:", publicaciones.length);

    // Verificar el tamaño del almacenamiento
    const tamano = new Blob([JSON.stringify(publicaciones)]).size;
    if (tamano > 1024 * 1024) {
      // 1MB
      console.warn(
        "⚠️ Almacenamiento de publicaciones excede 1MB, considera limpiar publicaciones antiguas",
      );
    }
  } catch (error) {
    console.error("❌ Error al guardar publicaciones:", error);
    if (error.name === "QuotaExceededError") {
      console.error(
        "💾 Cuota de localStorage excedida, intentando limpiar publicaciones antiguas...",
      );
      limpiarPublicacionesAntiguas();
      // Intentar guardar de nuevo con menos publicaciones
      try {
        const publicacionesReducidas = [];
        const contenedores = document.querySelectorAll(
          ".feed-publicaciones .contenedor-publicacion",
        );
        let contador = 0;

        contenedores.forEach((contenedor) => {
          if (contador >= 20) return; // Límite de emergencia

          const publicacion = contenedor.querySelector(".publicacion");
          if (
            !publicacion ||
            publicacion.id === "pub_ejemplo_1" ||
            publicacion.id === "pub_ejemplo_2"
          ) {
            return;
          }

          publicacionesReducidas.push({
            id: publicacion.id,
            html: contenedor.innerHTML,
            timestamp: Date.now(),
          });
          contador++;
        });

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(publicacionesReducidas),
        );
        console.log(
          "✅ Guardado de emergencia completado:",
          publicacionesReducidas.length,
        );
      } catch (emergencyError) {
        console.error("❌ Error en guardado de emergencia:", emergencyError);
      }
    }
  }
}

// Función para cargar publicaciones (híbrida: backend + localStorage)
async function cargarPublicaciones() {
  try {
    console.log("🔄 Cargando publicaciones...");

    // Verificar conexión con backend si está habilitado
    if (usarBackend) {
      await verificarConexionBackend();
    }

    // Obtener publicaciones del backend o localStorage
    const publicaciones = await obtenerPublicacionesHybrid();

    const feedPublicaciones = document.querySelector(".feed-publicaciones");
    if (!feedPublicaciones) {
      console.error("No se encontró el contenedor de publicaciones");
      return;
    }

    // NO limpiar publicaciones existentes aquí
    // En su lugar, solo Agregar las nuevas publicaciones que no existan
    const publicacionesExistentesIds = Array.from(
      feedPublicaciones.querySelectorAll(".publicacion"),
    ).map((pub) => pub.id);
    console.log(
      "📋 Publicaciones existentes en DOM:",
      publicacionesExistentesIds,
    );

    if (publicaciones.length === 0) {
      console.log("No hay publicaciones para cargar");
      return;
    }

    // Filtrar solo publicaciones que no existan ya en el DOM
    const publicacionesNuevas = publicaciones.filter((pub) => {
      const id = pub.id || pub.data?.id;
      return !publicacionesExistentesIds.includes(id);
    });

    console.log(
      `📦 ${publicacionesNuevas.length} publicaciones nuevas para Agregar de ${publicaciones.length} totales`,
    );

    if (publicacionesNuevas.length === 0) {
      console.log("No hay publicaciones nuevas para Agregar");
      return;
    }

    // Encontrar donde insertar las publicaciones (después de las de ejemplo)
    const ejemplos = feedPublicaciones.querySelectorAll(
      ".contenedor-publicacion",
    );
    let insertarDespuesDe = null;

    // Buscar la última publicación de ejemplo
    for (let i = 0; i < ejemplos.length; i++) {
      const pubId = ejemplos[i].querySelector(".publicacion")?.id;
      if (pubId === "pub_ejemplo_1" || pubId === "pub_ejemplo_2") {
        insertarDespuesDe = ejemplos[i];
      }
    }

    // Cargar solo las publicaciones nuevas
    publicacionesNuevas.forEach((publicacionData) => {
      // Si viene del backend, convertir a formato del frontend
      if (publicacionData.autor && publicacionData.fechaCreacion) {
        crearPublicacionDesdeBackend(
          publicacionData,
          insertarDespuesDe,
          feedPublicaciones,
        );
      } else if (publicacionData.html) {
        // Formato localStorage existente
        crearPublicacionDesdeLocalStorage(
          publicacionData,
          insertarDespuesDe,
          feedPublicaciones,
        );
      }
    });

    const fuente = backendConectado && usarBackend ? "backend" : "localStorage";
    console.log(
      `✅ ${publicacionesNuevas.length} publicaciones nuevas cargadas desde ${fuente}`,
    );
  } catch (error) {
    console.error("❌ Error al cargar publicaciones:", error);
  }
}

// Función para crear publicación desde datos del backend
function crearPublicacionDesdeBackend(
  publicacionData,
  insertarDespuesDe,
  feedPublicaciones,
) {
  const contenedor = document.createElement("div");
  contenedor.className = "contenedor-publicacion";

  // Verificar que los datos del autor estén completos
  if (!publicacionData.autor || !publicacionData.autor.username) {
    console.error(
      "Datos de autor incompletos en publicación del backend:",
      publicacionData,
    );
    return;
  }

  // Asegurar que todos los campos necesarios existan
  const autorData = {
    username: publicacionData.autor.username || "Usuario Anónimo",
    handle: publicacionData.autor.handle || "@anonimo",
    avatar: publicacionData.autor.avatar || "./assets/Logo/UFGPerfil.jpg",
  };

  // Convertir fecha ISO a timestamp para compatibilidad
  const timestamp = new Date(publicacionData.fechaCreacion).getTime();

  // Generar HTML para la publicación del backend
  const htmlPublicacion = `
        <div class="publicacion" id="${publicacionData.id}" data-timestamp="${timestamp}">
            <div class="usuario-info">
                <div class="avatar">
                    <img src="${autorData.avatar}" alt="${autorData.username}">
                </div>
                <div class="usuario-datos">
                    <h4>${autorData.username}</h4>
                    <p class="usuario-handle">${autorData.handle}</p>
                    <p class="tiempo-publicacion">${tiempoTranscurrido(publicacionData.fechaCreacion)}</p>
                </div>
            </div>
            <div class="contenido-publicacion">
                ${publicacionData.contenido ? `<p>${publicacionData.contenido}</p>` : ""}
                
                ${
                  publicacionData.imagen
                    ? `
                    <div class="carrusel-imagenes">
                        <div class="carrusel-contenedor">
                            <div class="imagen-slide active">
                                <img src="http://localhost:3001${publicacionData.imagen}" alt="Imagen de la publicación">
                                <button class="btn-expandir" onclick="expandirImagen('http://localhost:3001${publicacionData.imagen}', 'Imagen de la publicación')">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
            <div class="separador"></div>
            <div class="acciones-publicacion">
                <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, '${publicacionData.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span>${publicacionData.likes || 0}</span>
                </button>
                
                <button class="accion-btn comentarios" onclick="alternarComentarios('${publicacionData.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                    </svg>
                    <span>${publicacionData.comentarios ? publicacionData.comentarios.length : 0}</span>
                </button>
                
                <button class="accion-btn compartir">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314a2.25 2.25 0 1 1 .434 3.868l-9.566 5.314m0 0L6.75 21.75h10.5L12 17.25l-4.75 4.5Z" />
                    </svg>
                    <span>${publicacionData.compartidos || 0}</span>
                </button>
            </div>
            
            ${generarHTMLComentarios(publicacionData.id)}
        </div>
    `;

  contenedor.innerHTML = htmlPublicacion;

  // Insertar en la posición correcta
  if (insertarDespuesDe && insertarDespuesDe.nextElementSibling) {
    feedPublicaciones.insertBefore(
      contenedor,
      insertarDespuesDe.nextElementSibling,
    );
  } else if (insertarDespuesDe) {
    insertarDespuesDe.parentNode.insertBefore(
      contenedor,
      insertarDespuesDe.nextElementSibling,
    );
  } else {
    feedPublicaciones.appendChild(contenedor);
  }

  // Cargar comentarios si existen
  if (publicacionData.comentarios && publicacionData.comentarios.length > 0) {
    mostrarComentariosBackend(publicacionData.id, publicacionData.comentarios);
  }
}

// Función para crear publicación desde localStorage (formato existente)
function crearPublicacionDesdeLocalStorage(
  publicacionData,
  insertarDespuesDe,
  feedPublicaciones,
) {
  const contenedor = document.createElement("div");
  contenedor.className = "contenedor-publicacion";
  contenedor.innerHTML = publicacionData.html;

  // Restaurar el timestamp en el dataset
  const publicacion = contenedor.querySelector(".publicacion");
  if (publicacion) {
    publicacion.dataset.timestamp = publicacionData.timestamp;
  }

  // Insertar en la posición correcta
  if (insertarDespuesDe && insertarDespuesDe.nextElementSibling) {
    feedPublicaciones.insertBefore(
      contenedor,
      insertarDespuesDe.nextElementSibling,
    );
  } else if (insertarDespuesDe) {
    insertarDespuesDe.parentNode.insertBefore(
      contenedor,
      insertarDespuesDe.nextElementSibling,
    );
  } else {
    feedPublicaciones.appendChild(contenedor);
  }

  // Reinicializar eventos y carruseles si es necesario
  reinicializarEventosPublicacion(contenedor);
}

// Función para mostrar comentarios del backend
function mostrarComentariosBackend(publicacionId, comentarios) {
  const publicacion = document.getElementById(publicacionId);
  if (!publicacion) return;

  const seccionComentarios = publicacion.querySelector(".seccion-comentarios");
  if (!seccionComentarios) return;

  const listaComentarios =
    seccionComentarios.querySelector(".lista-comentarios");
  if (!listaComentarios) return;

  // Limpiar comentarios existentes
  listaComentarios.innerHTML = "";

  // Agregar comentarios del backend
  comentarios.forEach((comentario) => {
    const elementoComentario = document.createElement("div");
    elementoComentario.className = "comentario";
    elementoComentario.innerHTML = `
            <img src="${comentario.autor.avatar}" alt="${comentario.autor.username}" class="avatar-comentario">
            <div class="contenido-comentario">
                <div class="autor-comentario">
                    <strong>${comentario.autor.username}</strong>
                    <span class="handle-comentario">${comentario.autor.handle}</span>
                    <span class="tiempo-comentario">${tiempoTranscurrido(comentario.fechaCreacion)}</span>
                </div>
                <p>${comentario.contenido}</p>
            </div>
        `;
    listaComentarios.appendChild(elementoComentario);
  });
}

// Función para reinicializar eventos en publicaciones cargadas
function reinicializarEventosPublicacion(contenedor) {
  const publicacion = contenedor.querySelector(".publicacion");
  if (!publicacion) return;

  const publicacionId = publicacion.id;

  // Reinicializar carrusel si tiene múltiples imágenes
  const carrusel = publicacion.querySelector(".carrusel-imagenes");
  if (carrusel) {
    const slides = carrusel.querySelectorAll(".imagen-slide");
    if (slides.length > 1) {
      inicializarCarruselPublicacion(publicacionId, slides.length);
    }
  }

  // Reinicializar contadores de comentarios
  const botonComentarios = publicacion.querySelector(
    '.accion-btn[data-accion="comentar"]',
  );
  if (botonComentarios) {
    inicializarContadorComentarios(publicacionId);
  }

  // Reinicializar eventos de encuesta si existe
  const encuestaPub = publicacion.querySelector(".encuesta-publicada");
  if (encuestaPub) {
    try {
      const encuestaData = JSON.parse(encuestaPub.dataset.encuesta || "{}");
      if (encuestaData.id) {
        console.log(
          "Encuesta encontrada en publicación cargada:",
          encuestaData.id,
        );
        // Los eventos de voto ya están en el HTML como onclick
      }
    } catch (error) {
      console.warn("Error al procesar encuesta en publicación cargada:", error);
    }
  }

  // Reinicializar botones de imagen expandida
  const botonesExpandir = publicacion.querySelectorAll(".btn-expandir");
  botonesExpandir.forEach((boton) => {
    // Los eventos ya están como onclick en el HTML
    console.log("Botón expandir encontrado en publicación cargada");
  });
}

// Función para limpiar publicaciones antiguas (opcional)
function limpiarPublicacionesAntiguas() {
  try {
    const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
    if (!publicacionesGuardadas) return;

    const publicaciones = JSON.parse(publicacionesGuardadas);
    const ahora = Date.now();
    const unDiaEnMs = 24 * 60 * 60 * 1000; // 24 horas

    // Mantener solo publicaciones de las últimas 24 horas (opcional)
    const publicacionesRecientes = publicaciones.filter((pub) => {
      return ahora - pub.timestamp < unDiaEnMs * 7; // 7 días
    });

    if (publicacionesRecientes.length !== publicaciones.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(publicacionesRecientes));
      console.log("Publicaciones antiguas limpiadas");
    }
  } catch (error) {
    console.error("Error al limpiar publicaciones:", error);
  }
}

// Inicializar carrusel cuando se carga la página
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar backend y cargar publicaciones
  inicializarBackend();

  // Inicializar comentarios
  inicializarComentarios();

  // Limpiar publicaciones antiguas del localStorage
  limpiarPublicacionesAntiguas();

  // Inicializar componentes básicos
  inicializarCarrusel();
  inicializarAnimacionesEntrada();

  // Inicializar estados de likes
  setTimeout(() => {
    migrarLikesAntiguos();
    inicializarLikesPublicaciones();
    inicializarContadoresComentariosExistentes();

    // Migrar comentarios existentes a publicaciones
    migrarComentariosAPublicaciones();
  }, 500);

  // Configurar el selector de imágenes con mejor manejo de eventos
  const selectorImagenes = document.getElementById("selector-imagenes");
  if (selectorImagenes) {
    // Agregar el listener para cambios
    selectorImagenes.addEventListener("change", manejarSeleccionImagenes);

    // Debug: verificar propiedades del input
    console.log("Input file configurado:", {
      multiple: selectorImagenes.multiple,
      accept: selectorImagenes.accept,
      type: selectorImagenes.type,
    });
  }

  //Evento para volver a inicio
  document.getElementById("inicio").addEventListener("click", function () {
    document.querySelector(".mi-perfil").style.display = "flex";
    document.querySelector(".notificaciones").style.display = "flex";
    document.querySelector(".publicaciones").style.display = "flex";
    document.querySelector(".publicacion").style.display = "block";
    document.querySelectorAll(".feed-publicaciones").forEach((element) => {
      element.style.display = "block";
    });
    document.querySelectorAll(".contenedor-publicacion").forEach((element) => {
      element.style.display = "block";
    });
    document.querySelector(".marketplace").style.display = "none";
    document.querySelector(".titulo-comunidad").style.display = "none";
    document.querySelector(".titulo-marketplace").style.display = "none";
    document.querySelector(".titulo-perfil").style.display = "none";
    document.querySelector(".titulo-inicio").style.display = "block";
  });

  // Evitar que el modal se cierre al hacer click en la imagen
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    modalContent.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  // Cargar preferencia de modo guardada
  cargarModoGuardado();

  // Inicializar contadores de comentarios para publicaciones existentes
  inicializarContadoresComentarios();

  // Venta de artículos eliminada — lógica y modal removidos por petición del usuario
});

// Nota: la Funciónonalidad para crear/insertar artículos dinámicamente fue removida.

// Función para inicializar animaciones de entrada desde arriba
function inicializarAnimacionesEntrada() {
  // Agregar clase para elementos que necesitan animación (sin imágenes)
  const elementosAnimar = document.querySelectorAll(
    ".publicacion, .accion-btn, .avatar, .separador",
  );

  elementosAnimar.forEach((elemento, index) => {
    // Agregar estilo inicial (oculto y desplazado hacia arriba)
    elemento.style.opacity = "0";
    elemento.style.transform = "translateY(-30px)";
    elemento.style.transition = "all 0.4s ease-out";

    // Animar con delay escalonado más rápido
    setTimeout(
      () => {
        elemento.style.opacity = "1";
        elemento.style.transform = "translateY(0)";
      },
      100 * (index + 1) + 800,
    ); // Comenzar antes y con delays más cortos
  });

  // Animar botones de iconos con efecto especial más rápido
  const iconos = document.querySelectorAll(".icono-btn");
  iconos.forEach((icono, index) => {
    icono.style.opacity = "0";
    icono.style.transform = "translateY(-20px) scale(0.8)";
    icono.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    setTimeout(
      () => {
        icono.style.opacity = "1";
        icono.style.transform = "translateY(0) scale(1)";
      },
      50 * index + 1000,
    );
  });
}

// Función para animar nuevos elementos dinámicos
function animarElementoDesdeArriba(elemento, delay = 0) {
  elemento.style.opacity = "0";
  elemento.style.transform = "translateY(-30px)";
  elemento.style.transition = "all 0.4s ease-out";

  setTimeout(() => {
    elemento.style.opacity = "1";
    elemento.style.transform = "translateY(0)";
  }, delay);
}

// Función para inicializar el carrusel
function inicializarCarrusel() {
  // Buscar el carrusel principal (el primero en la página) y obtener sus slides
  const mainCarousel = document.querySelector(".carrusel-imagenes");
  let slides;
  if (mainCarousel) {
    slides = mainCarousel.querySelectorAll(".imagen-slide");
    totalSlides = slides.length;
  } else {
    // Fallback: si no hay un carrusel específico, contar todos los slides
    slides = document.querySelectorAll(".imagen-slide");
    totalSlides = slides.length;
  }

  if (totalSlides > 0) {
    const totalEl = document.getElementById("total-imagenes");
    if (totalEl) totalEl.textContent = totalSlides;
    // Asegurar que el contador muestre el valor inicial
    actualizarSlide();
  }
}

// Función para cambiar de slide
function cambiarSlide(direccion) {
  // Operar solo sobre el carrusel principal (el primero)
  const mainCarousel = document.querySelector(".carrusel-imagenes");
  const slides = mainCarousel
    ? mainCarousel.querySelectorAll(".imagen-slide")
    : document.querySelectorAll(".imagen-slide");
  const indicadores = mainCarousel
    ? mainCarousel.parentElement.querySelectorAll(".indicador")
    : document.querySelectorAll(".indicador");

  if (slides.length === 0) return;

  // Remover clase active del slide actual (si existe)
  if (slides[slideActual]) slides[slideActual].classList.remove("active");
  if (indicadores[slideActual])
    indicadores[slideActual].classList.remove("active");

  // Calcular nuevo slide
  slideActual += direccion;

  // Ciclo infinito
  if (slideActual >= slides.length) {
    slideActual = 0;
  } else if (slideActual < 0) {
    slideActual = slides.length - 1;
  }

  // Activar nuevo slide
  slides[slideActual].classList.add("active");
  if (indicadores[slideActual])
    indicadores[slideActual].classList.add("active");

  // Actualizar contador (si existe el elemento global)
  const imagenActualEl = document.getElementById("imagen-actual");
  if (imagenActualEl) imagenActualEl.textContent = slideActual + 1;
}

// Función para ir a un slide específico
function irSlide(index) {
  // Operar solo sobre el carrusel principal (el primero)
  const mainCarousel = document.querySelector(".carrusel-imagenes");
  const slides = mainCarousel
    ? mainCarousel.querySelectorAll(".imagen-slide")
    : document.querySelectorAll(".imagen-slide");
  const indicadores = mainCarousel
    ? mainCarousel.parentElement.querySelectorAll(".indicador")
    : document.querySelectorAll(".indicador");

  if (slides.length === 0) return;

  // Remover clase active del slide actual
  if (slides[slideActual]) slides[slideActual].classList.remove("active");
  if (indicadores[slideActual])
    indicadores[slideActual].classList.remove("active");

  // Cambiar al slide seleccionado
  slideActual = Math.max(0, Math.min(index, slides.length - 1));

  // Activar nuevo slide
  slides[slideActual].classList.add("active");
  if (indicadores[slideActual])
    indicadores[slideActual].classList.add("active");

  // Actualizar contador
  const imagenActualEl = document.getElementById("imagen-actual");
  if (imagenActualEl) imagenActualEl.textContent = slideActual + 1;
}

// Función para actualizar el slide inicial
function actualizarSlide() {
  const imagenActualEl = document.getElementById("imagen-actual");
  if (imagenActualEl) imagenActualEl.textContent = slideActual + 1;
}

// Navegación con teclado para el carrusel
document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") {
    cambiarSlide(-1);
  } else if (event.key === "ArrowRight") {
    cambiarSlide(1);
  } else if (event.key === "Escape") {
    cerrarModal();
  }
});

// Función para expandir imagen
function expandirImagen(src, alt) {
  const modal = document.getElementById("modal-imagen");
  const imagenExpandida = document.getElementById("imagen-expandida");

  // Configurar la imagen en el modal
  imagenExpandida.src = src;
  imagenExpandida.alt = alt;

  // Mostrar el modal
  modal.classList.add("active");

  // Prevenir scroll del body
  document.body.style.overflow = "hidden";
}

// Función para cerrar modal
function cerrarModal() {
  const modal = document.getElementById("modal-imagen");

  // Ocultar el modal
  modal.classList.remove("active");

  // Restaurar scroll del body
  document.body.style.overflow = "auto";
}

// Función para cambiar entre modo claro y oscuro
function cambiarModo() {
  const root = document.documentElement;
  const isModoClaro = root.classList.contains("modo-claro");

  if (isModoClaro) {
    // Cambiar a modo oscuro
    root.classList.remove("modo-claro");
    localStorage.setItem("tema", "oscuro");
    actualizarIconoModo(false);
  } else {
    // Cambiar a modo claro
    root.classList.add("modo-claro");
    localStorage.setItem("tema", "claro");
    actualizarIconoModo(true);
  }
}

// Función para actualizar el icono según el modo
function actualizarIconoModo(esModoClaro) {
  const iconoModo = document.getElementById("icono-modo");

  if (esModoClaro) {
    // Icono de sol para modo claro
    iconoModo.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />`;
  } else {
    // Icono de luna para modo oscuro
    iconoModo.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />`;
  }
}

// Función para cargar el modo guardado en localStorage
function cargarModoGuardado() {
  const temaGuardado = localStorage.getItem("tema");
  const root = document.documentElement;

  if (temaGuardado === "claro") {
    root.classList.add("modo-claro");
    actualizarIconoModo(true);
  } else {
    root.classList.remove("modo-claro");
    actualizarIconoModo(false);
  }
}

// Función para seleccionar ventana en el sidebar
function seleccionarVentana(botonSeleccionado) {
  // Remover clase active de todos los botones del sidebar
  const botonesSidebar = document.querySelectorAll(".secciones button");
  botonesSidebar.forEach((boton) => {
    boton.classList.remove("active");
    // Pequeña animación de salida
    boton.style.transform = "translateY(-5px)";
    setTimeout(() => {
      boton.style.transform = "translateY(0)";
    }, 150);
  });

  // Agregar clase active al botón seleccionado con animación especial
  botonSeleccionado.classList.add("active");
  botonSeleccionado.style.transform = "translateY(-10px) scale(1.05)";
  setTimeout(() => {
    botonSeleccionado.style.transform = "translateY(0) scale(1)";
  }, 300);
}

// Botones para cambiar de seccion

// Variables para manejo de imágenes
let imagenesSeleccionadas = [];

// Función para abrir el selector de archivos multimedia (imágenes y videos)
function abrirSelectorImagenes() {
  const selectorImagenes = document.getElementById("selector-imagenes");

  // Verificar si ya se alcanzó el límite
  if (imagenesSeleccionadas.length >= 5) {
    alert(
      "Ya tienes el máximo de 5 archivos seleccionados. Elimina algunos para Agregar nuevos.",
    );
    return;
  }

  // Configurar para imágenes y videos
  selectorImagenes.accept =
    "image/*,image/jpeg,image/png,image/gif,image/webp,video/*,video/mp4,video/webm,video/ogg";

  // Limpiar el valor del input para permitir seleccionar los mismos archivos
  selectorImagenes.value = "";
  // Activar el selector
  selectorImagenes.click();
}

// Función para abrir el selector solo de videos
function abrirSelectorVideos() {
  const selectorImagenes = document.getElementById("selector-imagenes");

  // Verificar si ya se alcanzó el límite
  if (imagenesSeleccionadas.length >= 5) {
    alert(
      "Ya tienes el máximo de 5 archivos seleccionados. Elimina algunos para Agregar nuevos.",
    );
    return;
  }

  // Configurar solo para videos
  selectorImagenes.accept = "video/*,video/mp4,video/webm,video/ogg";

  // Limpiar el valor del input para permitir seleccionar los mismos archivos
  selectorImagenes.value = "";
  // Activar el selector
  selectorImagenes.click();
}

// Función para manejar la selección de imágenes
function manejarSeleccionImagenes(event) {
  const archivos = Array.from(event.target.files);
  const previewContainer = document.getElementById("preview-imagenes");
  const listaPreview = document.getElementById("lista-preview-imagenes");

  console.log(`Archivos seleccionados: ${archivos.length}`); // Debug
  console.log(`Imágenes ya seleccionadas: ${imagenesSeleccionadas.length}`); // Debug

  // Verificar que hay archivos seleccionados
  if (archivos.length === 0) {
    return;
  }

  // Calcular cuántas imágenes se pueden Agregar
  const espacioDisponible = 5 - imagenesSeleccionadas.length;

  if (espacioDisponible <= 0) {
    alert(
      "Ya tienes el máximo de 5 archivos seleccionados. Elimina algunos para Agregar nuevos.",
    );
    event.target.value = ""; // Limpiar selección
    return;
  }

  // Verificar si la nueva selección excede el límite
  if (archivos.length > espacioDisponible) {
    alert(
      `Solo puedes Agregar ${espacioDisponible} imagen${espacioDisponible !== 1 ? "es" : ""} más. Tienes ${imagenesSeleccionadas.length} de 5 imágenes seleccionadas.`,
    );
    event.target.value = ""; // Limpiar selección
    return;
  }

  // Mostrar contenedor de preview si no está visible
  if (imagenesSeleccionadas.length === 0) {
    previewContainer.style.display = "block";
  }

  let imagenesProcessadas = 0;
  const totalArchivos = archivos.length;

  archivos.forEach((archivo, index) => {
    // Verificar que sea un archivo de imagen o video
    if (
      !archivo.type.startsWith("image/") &&
      !archivo.type.startsWith("video/")
    ) {
      imagenesProcessadas++;
      if (imagenesProcessadas === totalArchivos) {
        actualizarContadorImagenes();
        // Limpiar el input para permitir seleccionar los mismos archivos de nuevo si es necesario
        event.target.value = "";
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      const archivoData = {
        archivo: archivo,
        dataUrl: e.target.result,
        nombre: archivo.name,
        tipo: archivo.type.startsWith("image/") ? "imagen" : "video",
      };

      // Agregar a los archivos existentes (no reemplazar)
      imagenesSeleccionadas.push(archivoData);

      // Crear elemento de preview
      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";

      let contenidoMultimedia = "";
      if (archivo.type.startsWith("image/")) {
        contenidoMultimedia = `<img src="${e.target.result}" alt="${archivo.name}">`;
      } else if (archivo.type.startsWith("video/")) {
        contenidoMultimedia = `
                    <video controls>
                        <source src="${e.target.result}" type="${archivo.type}">
                        Tu navegador no soporta el elemento video.
                    </video>
                `;
      }

      previewItem.innerHTML = `
                <div class="preview-imagen">
                    ${contenidoMultimedia}
                    <button class="btn-eliminar-imagen" onclick="eliminarImagenPorElemento(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="12" height="12">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <span class="nombre-archivo">${archivo.name}</span>
            `;

      // Agregar el nuevo elemento al final de la lista
      listaPreview.appendChild(previewItem);

      // Animar entrada del elemento
      setTimeout(() => {
        animarElementoDesdeArriba(previewItem, 0);
      }, 100 * imagenesProcessadas);

      imagenesProcessadas++;

      // Actualizar contador y limpiar input cuando todas las imágenes estén procesadas
      if (imagenesProcessadas === totalArchivos) {
        actualizarContadorImagenes();
        // Limpiar el input para permitir seleccionar más imágenes
        event.target.value = "";
      }
    };

    reader.onerror = function () {
      console.error(`Error al leer el archivo: ${archivo.name}`);
      imagenesProcessadas++;
      if (imagenesProcessadas === totalArchivos) {
        actualizarContadorImagenes();
        // Limpiar el input
        event.target.value = "";
      }
    };

    reader.readAsDataURL(archivo);
  });
}

// Función para eliminar imagen basada en el elemento del botón
function eliminarImagenPorElemento(botonEliminar) {
  const previewItem = botonEliminar.closest(".preview-item");
  const listaPreview = document.getElementById("lista-preview-imagenes");
  const previewContainer = document.getElementById("preview-imagenes");

  if (previewItem) {
    // Encontrar el índice del elemento en la lista actual
    const items = Array.from(listaPreview.querySelectorAll(".preview-item"));
    const index = items.indexOf(previewItem);

    if (index !== -1) {
      // Animar salida
      previewItem.style.opacity = "0";
      previewItem.style.transform = "translateX(-100px)";

      setTimeout(() => {
        // Remover de la lista de imágenes seleccionadas
        imagenesSeleccionadas.splice(index, 1);

        // Remover elemento del DOM
        previewItem.remove();

        // Actualizar contador
        actualizarContadorImagenes();

        // Ocultar preview si no hay imágenes
        if (imagenesSeleccionadas.length === 0) {
          previewContainer.style.display = "none";
          // Limpiar también el input file
          const selectorImagenes = document.getElementById("selector-imagenes");
          selectorImagenes.value = "";
        }
      }, 300);
    }
  }
}

// Función para actualizar el contador de archivos multimedia
function actualizarContadorImagenes() {
  const contador = document.getElementById("contador-imagenes");
  const cantidad = imagenesSeleccionadas.length;
  const espacioDisponible = 5 - cantidad;

  // Contar imágenes y videos por separado
  const imagenes = imagenesSeleccionadas.filter(
    (item) => item.tipo === "imagen",
  ).length;
  const videos = imagenesSeleccionadas.filter(
    (item) => item.tipo === "video",
  ).length;

  let texto = "";
  if (imagenes > 0 && videos > 0) {
    texto = `${imagenes} imagen${imagenes !== 1 ? "es" : ""} y ${videos} video${videos !== 1 ? "s" : ""} seleccionado${videos !== 1 ? "s" : ""}`;
  } else if (imagenes > 0) {
    texto = `${imagenes} imagen${imagenes !== 1 ? "es" : ""} seleccionada${imagenes !== 1 ? "s" : ""}`;
  } else if (videos > 0) {
    texto = `${videos} video${videos !== 1 ? "s" : ""} seleccionado${videos !== 1 ? "s" : ""}`;
  } else {
    texto = "0 archivos seleccionados";
  }

  if (cantidad < 5) {
    texto += ` (puedes Agregar ${espacioDisponible} más)`;
  } else {
    texto += ` (máximo alcanzado)`;
  }

  contador.textContent = texto;
}

// Función para limpiar todas las imágenes
function limpiarImagenes() {
  const previewContainer = document.getElementById("preview-imagenes");
  const listaPreview = document.getElementById("lista-preview-imagenes");
  const selectorImagenes = document.getElementById("selector-imagenes");

  // Animar salida de todos los elementos
  const items = listaPreview.querySelectorAll(".preview-item");
  items.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-20px)";
    }, index * 50);
  });

  setTimeout(
    () => {
      imagenesSeleccionadas = [];
      listaPreview.innerHTML = "";
      selectorImagenes.value = "";
      previewContainer.style.display = "none";
    },
    items.length * 50 + 300,
  );
}

// Modal de alerta reutilizable que reemplaza alert() nativa
function showAlert(message, title = "¡Atención!") {
  return showCustomAlert(message, title, "warning");
}

// Función para mostrar alertas de éxito
function mostrarAlertaExito(titulo, mensaje) {
  return showCustomAlert(mensaje, titulo, "success");
}

// Función para mostrar alertas de error
function mostrarAlertaError(titulo, mensaje) {
  return showCustomAlert(mensaje, titulo, "error");
}

// Función para mostrar alertas de información
function mostrarAlertaInfo(titulo, mensaje) {
  return showCustomAlert(mensaje, titulo, "info");
}

// Función base personalizada para diferentes tipos de alertas
function showCustomAlert(message, title = "¡Atención!", type = "warning") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-alert-overlay");
    const msgEl = document.getElementById("modal-alert-message");
    const titleEl = document.getElementById("modal-alert-title");
    const btn = document.getElementById("modal-alert-btn");
    const iconSvg = document.getElementById("modal-icon-svg");

    if (!overlay || !btn || !msgEl || !titleEl || !iconSvg) {
      // Fallback a alert si el modal no está presente
      alert(message);
      resolve();
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;

    // Cambiar el icono y colores según el tipo
    switch (type) {
      case "success":
        iconSvg.innerHTML = `
                    <circle cx="12" cy="12" r="12" fill="#22C55E"/>
                    <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                `;
        btn.textContent = "Excelente";
        btn.className = "modal-alert-btn success";
        break;
      case "error":
        iconSvg.innerHTML = `
                    <circle cx="12" cy="12" r="12" fill="#EF4444"/>
                    <path d="M15 9l-6 6m0-6l6 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                `;
        btn.textContent = "Entendido";
        btn.className = "modal-alert-btn error";
        break;
      case "info":
        iconSvg.innerHTML = `
                    <circle cx="12" cy="12" r="12" fill="#3B82F6"/>
                    <path d="M12 16v-4m0-4h.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                `;
        btn.textContent = "Entendido";
        btn.className = "modal-alert-btn info";
        break;
      default: // warning
        iconSvg.innerHTML = `
                    <circle cx="12" cy="12" r="12" fill="#FFDE21"/>
                    <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" fill="#000"/>
                `;
        btn.textContent = "Entendido";
        btn.className = "modal-alert-btn";
        break;
    }

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    // Guardar elemento activo antes para restaurar foco
    const previo = document.activeElement;

    // Manejo de cierre
    function limpiar() {
      overlay.classList.remove("active");
      document.body.style.overflow = "auto";
      btn.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeydown);
      overlay.removeEventListener("click", onOverlayClick);
      if (previo)
        try {
          previo.focus();
        } catch (e) {}
    }

    function onClick() {
      limpiar();
      resolve();
    }

    function onOverlayClick(e) {
      if (e.target === overlay) {
        limpiar();
        resolve();
      }
    }

    function onKeydown(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        limpiar();
        resolve();
      }
    }

    btn.addEventListener("click", onClick);
    overlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKeydown);

    // Forzar foco en el botón para accesibilidad
    setTimeout(() => {
      try {
        btn.focus();
      } catch (e) {}
    }, 10);
  });
}

// Función global para compatibilidad con otros archivos
function mostrarModalAlert(titulo, mensaje) {
  return mostrarAlerta(titulo, mensaje);
}

// Alias para diferentes tipos de alertas
function mostrarAlerta(titulo, mensaje) {
  // Determinar el tipo de alerta basado en el título
  if (
    titulo.toLowerCase().includes("éxito") ||
    titulo.toLowerCase().includes("exito")
  ) {
    return mostrarAlertaExito(titulo, mensaje);
  } else if (titulo.toLowerCase().includes("error")) {
    return mostrarAlertaError(titulo, mensaje);
  } else if (
    titulo.toLowerCase().includes("información") ||
    titulo.toLowerCase().includes("informacion")
  ) {
    return mostrarAlertaInfo(titulo, mensaje);
  } else {
    // Para advertencias, usar el sistema existente
    return showAlert(mensaje, titulo);
  }
}

// Función unificada para publicar contenido (texto, imágenes y encuestas)
async function publicarContenido(event) {
  // Prevenir el comportamiento por defecto del formulario
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const textoPublicacion = document
    .getElementById("texto-publicacion")
    .value.trim();
  const creadorEncuesta = document.getElementById("creador-encuesta");

  // Si hay una encuesta abierta, validarla primero
  if (creadorEncuesta && creadorEncuesta.style.display !== "none") {
    if (!crearEncuesta()) {
      return false; // Si la validación falla, no continuar
    }
  }

  // Verificar que hay contenido para publicar
  if (textoPublicacion === "") {
    await showAlert("Debes escribir un texto aquí para poder publicar.");
    document.getElementById("texto-publicacion").focus();
    return false;
  }

  try {
    console.log("📝 Iniciando creación de publicación...");

    // Debug: verificar que la encuesta existe
    if (encuestaActual) {
      console.log("Publicando encuesta:", encuestaActual);
    } else {
      console.log("No hay encuesta para publicar");
    }

    // Crear nueva publicación con todos los elementos disponibles
    await crearNuevaPublicacion(
      textoPublicacion,
      imagenesSeleccionadas,
      encuestaActual,
    );

    // Limpiar formulario solo si la publicación fue exitosa
    document.getElementById("texto-publicacion").value = "";
    limpiarImagenes();
    ocultarIndicadorEncuesta();
    encuestaActual = null;

    console.log("✅ Publicación creada exitosamente");
  } catch (error) {
    console.error("❌ Error al crear publicación:", error);
  }

  return false; // Prevenir cualquier envío de formulario
}

// Función para verificar si se presiona Enter para publicar
function verificarEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    publicarContenido();
  }
}

// Función para crear una nueva publicación con el formato existente (híbrida: backend + localStorage)
async function crearNuevaPublicacion(texto, imagenes, encuesta = null) {
  try {
    console.log("📝 Creando nueva publicación...");

    // Si el backend está disponible, intentar guardar ahí primero
    if (usarBackend && backendConectado) {
      console.log("📡 Guardando en backend...");

      // Preparar imagen para el backend (solo la primera por ahora)
      let imagenArchivo = null;
      if (imagenes && imagenes.length > 0) {
        imagenArchivo = imagenes[0].archivo; // Tomar el archivo original
      }

      // Crear publicación en el backend
      const publicacionBackend = await crearPublicacionBackend(
        texto,
        imagenArchivo,
        "general",
        ["frontend"],
      );

      if (publicacionBackend) {
        console.log(
          "✅ Publicación guardada en backend:",
          publicacionBackend.id,
        );

        // Crear la publicación en el frontend usando los datos del backend
        crearPublicacionEnFrontend(publicacionBackend, true);

        // Mostrar notificación de éxito
        mostrarNotificacion("¡Publicación creada exitosamente!", "success");
        return;
      } else {
        console.warn(
          "⚠️ Error al guardar en backend, usando localStorage como fallback",
        );
      }
    }

    // Fallback: crear publicación usando el método original (localStorage)
    console.log("💾 Guardando en localStorage...");
    crearPublicacionOriginal(texto, imagenes, encuesta);
  } catch (error) {
    console.error("❌ Error creando publicación:", error);

    // Fallback en caso de error
    crearPublicacionOriginal(texto, imagenes, encuesta);
  }
}

// Función para crear publicación en el frontend usando datos del backend
function crearPublicacionEnFrontend(publicacionData, esDelBackend = false) {
  const feedPublicaciones = document.querySelector(".feed-publicaciones");

  // Verificar que los datos del autor estén completos
  if (!publicacionData.autor || !publicacionData.autor.username) {
    console.error("Datos de autor incompletos:", publicacionData);
    return;
  }

  // Asegurar que todos los campos necesarios existan
  const autorData = {
    username: publicacionData.autor.username || "Usuario Anónimo",
    handle: publicacionData.autor.handle || "@anonimo",
    avatar: publicacionData.autor.avatar || "./assets/Logo/UFGPerfil.jpg",
  };

  // Inicializar array de comentarios si no existe
  if (!publicacionData.comentarios) {
    publicacionData.comentarios = [];
  }

  // Sincronizar comentarios del storage global con la publicación
  if (comentariosPorPublicacion[publicacionData.id]) {
    publicacionData.comentarios = [
      ...comentariosPorPublicacion[publicacionData.id],
    ];
  }

  // Crear contenedor individual para esta publicación
  const contenedorPublicacion = document.createElement("div");
  contenedorPublicacion.className = "contenedor-publicacion";

  // Crear la publicación
  const nuevaPublicacion = document.createElement("div");
  nuevaPublicacion.className = "publicacion";
  nuevaPublicacion.id = publicacionData.id;

  // Convertir fecha ISO a timestamp para compatibilidad
  const timestamp = new Date(publicacionData.fechaCreacion).getTime();
  nuevaPublicacion.dataset.timestamp = timestamp;

  // Guardar datos completos de la publicación (incluyendo comentarios) como atributo
  nuevaPublicacion.dataset.publicacionCompleta =
    JSON.stringify(publicacionData);

  // Obtener datos del usuario
  const datosUsuario = obtenerDatosUsuario();

  // Construir HTML de la publicación
  let htmlPublicacion = `
        <div class="usuario-info">
            <div class="avatar">
                <img src="${autorData.avatar}" alt="${autorData.username}">
            </div>
            <div class="usuario-datos">
                <h4>${autorData.username}</h4>
                <p class="usuario-handle">${autorData.handle}</p>
                <p class="tiempo-publicacion">ahora</p>
            </div>
        </div>
        <div class="contenido-publicacion">
            ${publicacionData.contenido ? `<p>${publicacionData.contenido}</p>` : ""}
    `;

  // Agregar imagen si existe
  if (publicacionData.imagen) {
    const imagenUrl = esDelBackend
      ? `http://localhost:3001${publicacionData.imagen}`
      : publicacionData.imagen;

    htmlPublicacion += `
            <div class="carrusel-imagenes">
                <div class="carrusel-contenedor">
                    <div class="imagen-slide active">
                        <img src="${imagenUrl}" alt="Imagen de la publicación">
                        <button class="btn-expandir" onclick="expandirImagen('${imagenUrl}', 'Imagen de la publicación')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  // Cerrar contenido-publicacion y Agregar separador
  htmlPublicacion += `
        </div>
        <div class="separador"></div>
    `;

  // Agregar acciones
  htmlPublicacion += `
        <div class="acciones-publicacion">
            <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, '${publicacionData.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>${publicacionData.likes || 0}</span>
            </button>
            
            <button class="accion-btn comentarios" onclick="alternarComentarios('${publicacionData.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                <span>0</span>
            </button>
            
            <button class="accion-btn compartir">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314a2.25 2.25 0 1 1 .434 3.868l-9.566 5.314m0 0L6.75 21.75h10.5L12 17.25l-4.75 4.5Z" />
                </svg>
                <span>0</span>
            </button>
        </div>
        
        ${generarHTMLComentarios(publicacionData.id)}
    `;

  nuevaPublicacion.innerHTML = htmlPublicacion;
  contenedorPublicacion.appendChild(nuevaPublicacion);

  // Agregar animación de entrada
  contenedorPublicacion.style.opacity = "0";
  contenedorPublicacion.style.transform = "translateY(-20px)";
  contenedorPublicacion.style.transition =
    "opacity 0.3s ease, transform 0.3s ease";

  // Insertar al inicio del feed (después de las publicaciones de ejemplo)
  const primerElemento = feedPublicaciones.querySelector(
    ".contenedor-publicacion",
  );
  if (primerElemento) {
    // Buscar después de las publicaciones de ejemplo
    let insertarDespues = null;
    const ejemplos = feedPublicaciones.querySelectorAll(
      ".contenedor-publicacion",
    );

    for (let i = 0; i < ejemplos.length; i++) {
      const pubId = ejemplos[i].querySelector(".publicacion")?.id;
      if (pubId === "pub_ejemplo_1" || pubId === "pub_ejemplo_2") {
        insertarDespues = ejemplos[i];
      } else {
        break;
      }
    }

    if (insertarDespues && insertarDespues.nextElementSibling) {
      feedPublicaciones.insertBefore(
        contenedorPublicacion,
        insertarDespues.nextElementSibling,
      );
    } else if (insertarDespues) {
      insertarDespues.parentNode.insertBefore(
        contenedorPublicacion,
        insertarDespues.nextElementSibling,
      );
    } else {
      feedPublicaciones.insertBefore(contenedorPublicacion, primerElemento);
    }
  } else {
    feedPublicaciones.appendChild(contenedorPublicacion);
  }

  // Activar animación
  setTimeout(() => {
    contenedorPublicacion.style.opacity = "1";
    contenedorPublicacion.style.transform = "translateY(0)";

    // Inicializar estado de likes para esta publicación
    inicializarLikePublicacion(publicacionData.id);
  }, 10);

  // Los datos se mantienen sincronizados con el backend
}

// Función original para crear publicación (localStorage)
function crearPublicacionOriginal(texto, imagenes, encuesta = null) {
  const feedPublicaciones = document.querySelector(".feed-publicaciones");

  // Crear contenedor individual para esta publicación
  const contenedorPublicacion = document.createElement("div");
  contenedorPublicacion.className = "contenedor-publicacion";

  // Crear la publicación
  const nuevaPublicacion = document.createElement("div");
  nuevaPublicacion.className = "publicacion";

  // Generar ID único para esta publicación y timestamp
  const timestamp = Date.now();
  const publicacionId = "pub_" + timestamp;
  nuevaPublicacion.id = publicacionId;
  nuevaPublicacion.dataset.timestamp = timestamp;

  // Generar HTML de multimedia si existen
  let htmlImagenes = "";
  if (imagenes.length > 0) {
    htmlImagenes = `
            <div class="carrusel-imagenes">
                <div class="carrusel-contenedor">
                    ${imagenes
                      .map(
                        (archivo, index) => `
                        <div class="imagen-slide ${index === 0 ? "active" : ""} ${archivo.tipo === "video" ? "tiene-video" : ""}">
                            ${
                              archivo.tipo === "imagen"
                                ? `<img src="${archivo.dataUrl}" alt="${archivo.nombre}">
                                 <button class="btn-expandir" onclick="expandirImagen('${archivo.dataUrl}', '${archivo.nombre}')">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                         <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                     </svg>
                                 </button>`
                                : `<video controls preload="metadata">
                                     <source src="${archivo.dataUrl}" type="${archivo.archivo.type}">
                                     Tu navegador no soporta el elemento video.
                                 </video>`
                            }
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                
                ${
                  imagenes.length > 1
                    ? `
                <!-- Botones de navegación -->
                <button class="btn-anterior" onclick="cambiarSlidePublicacion('${publicacionId}', -1)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <button class="btn-siguiente" onclick="cambiarSlidePublicacion('${publicacionId}', 1)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                
                <!-- Indicadores -->
                <div class="indicadores">
                    ${imagenes
                      .map(
                        (_, index) => `
                        <div class="indicador ${index === 0 ? "active" : ""}" onclick="irSlidePublicacion('${publicacionId}', ${index})"></div>
                    `,
                      )
                      .join("")}
                </div>
                
                <!-- Contador de archivos -->
                <div class="contador-imagenes">
                    <span class="imagen-actual">1</span> / <span class="total-imagenes">${imagenes.length}</span>
                </div>
                `
                    : ""
                }
            </div>
        `;
  }

  // Generar HTML de encuesta si existe
  let htmlEncuesta = "";
  if (encuesta) {
    console.log("Generando HTML para encuesta:", encuesta);
    const encuestaId = "encuesta_" + Date.now();
    const tiempoRestanteTexto = tiempoRestante(
      encuesta.fechaCreacion,
      encuesta.duracionHoras,
    );

    htmlEncuesta = `
            <div class="encuesta-publicada" id="${encuestaId}" data-encuesta='${JSON.stringify(encuesta).replace(/'/g, "&apos;")}' style="display: block;">
                <div class="encuesta-pregunta">
                    <h4>${encuesta.pregunta}</h4>
                </div>
                <div class="encuesta-opciones">
                    ${encuesta.opciones
                      .map(
                        (opcion, index) => `
                        <div class="opcion-encuesta" onclick="votarEnEncuesta('${encuestaId}', ${index})">
                            <div class="opcion-contenido">
                                <span class="texto-opcion">${opcion.texto}</span>
                                <div class="resultados-opcion">
                                    <span class="porcentaje-votos">0%</span>
                                    <span class="numero-votos">0 votos</span>
                                </div>
                            </div>
                            <div class="barra-progreso-container">
                                <div class="barra-progreso" style="width: 0%"></div>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="encuesta-info">
                    <span class="total-votos">${encuesta.totalVotos} votos totales</span>
                    <span class="tiempo-restante">${tiempoRestanteTexto}</span>
                </div>
            </div>
        `;
    console.log("HTML de encuesta generado:", htmlEncuesta);
  } else {
    console.log("No hay encuesta para generar HTML");
  }

  nuevaPublicacion.innerHTML = `
        <div class="usuario-info">
            <div class="avatar">
                <img src="${obtenerDatosUsuario().avatar}" alt="Avatar usuario">
            </div>
            <div class="usuario-datos">
                <h4>${obtenerDatosUsuario().username}</h4>
                <p class="usuario-handle">${obtenerDatosUsuario().handle}</p>
                <p class="tiempo-publicacion">hace unos segundos</p>
            </div>
            <div class="menu-opciones">
                <button class="btn-menu-publicacion" onclick="toggleMenuPublicacion('${publicacionId}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                </button>
                <div class="menu-dropdown-publicacion" id="menu-pub-${publicacionId}">
                    <button class="menu-opcion eliminar" onclick="eliminarPublicacion('${publicacionId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Eliminar publicación
                    </button>
                </div>
            </div>
        </div>
        <div class="contenido-publicacion">
            ${texto ? `<p>${texto}</p>` : ""}
            ${htmlImagenes}
            ${htmlEncuesta}
        </div>
        <div class="separador"></div>
        <div class="acciones-publicacion">
            <button class="accion-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>0</span>
            </button>
            <button class="accion-btn" data-publicacion="${publicacionId}" data-accion="comentar" onclick="toggleComentarios('${publicacionId}')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                <span>0</span>
            </button>
            <button class="accion-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-11.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
                </svg>
                <span>Compartir</span>
            </button>
        </div>
    `;

  // Agregar la publicación al contenedor
  contenedorPublicacion.appendChild(nuevaPublicacion);

  // Insertar el contenedor al principio del feed
  feedPublicaciones.insertBefore(
    contenedorPublicacion,
    feedPublicaciones.firstChild,
  );

  // Animar entrada del contenedor
  animarElementoDesdeArriba(contenedorPublicacion, 0);

  // Inicializar carrusel específico para esta publicación si hay múltiples imágenes
  if (imagenes.length > 1) {
    inicializarCarruselPublicacion(publicacionId, imagenes.length);
  }

  console.log("✅ Publicación creada localmente");
  mostrarNotificacion("¡Publicación creada!", "success");
}

// Sistema de carruseles para publicaciones dinámicas
let carruselesPublicaciones = {};

// Función para inicializar carrusel específico de una publicación
function inicializarCarruselPublicacion(publicacionId, totalImagenes) {
  carruselesPublicaciones[publicacionId] = {
    slideActual: 0,
    totalSlides: totalImagenes,
  };
}

// Función para cambiar slide en una publicación específica
function cambiarSlidePublicacion(publicacionId, direccion) {
  if (!carruselesPublicaciones[publicacionId]) return;

  const publicacion = document.getElementById(publicacionId);
  if (!publicacion) return;

  const slides = publicacion.querySelectorAll(".imagen-slide");
  const indicadores = publicacion.querySelectorAll(".indicador");
  const contadorActual = publicacion.querySelector(".imagen-actual");

  const carrusel = carruselesPublicaciones[publicacionId];

  // Remover clase active del slide actual
  slides[carrusel.slideActual].classList.remove("active");
  indicadores[carrusel.slideActual].classList.remove("active");

  // Calcular nuevo slide
  carrusel.slideActual += direccion;

  // Ciclo infinito
  if (carrusel.slideActual >= carrusel.totalSlides) {
    carrusel.slideActual = 0;
  } else if (carrusel.slideActual < 0) {
    carrusel.slideActual = carrusel.totalSlides - 1;
  }

  // Activar nuevo slide
  slides[carrusel.slideActual].classList.add("active");
  indicadores[carrusel.slideActual].classList.add("active");

  // Actualizar contador
  contadorActual.textContent = carrusel.slideActual + 1;
}

// Función para ir a un slide específico en una publicación
function irSlidePublicacion(publicacionId, index) {
  if (!carruselesPublicaciones[publicacionId]) return;

  const publicacion = document.getElementById(publicacionId);
  if (!publicacion) return;

  const slides = publicacion.querySelectorAll(".imagen-slide");
  const indicadores = publicacion.querySelectorAll(".indicador");
  const contadorActual = publicacion.querySelector(".imagen-actual");

  const carrusel = carruselesPublicaciones[publicacionId];

  // Remover clase active del slide actual
  slides[carrusel.slideActual].classList.remove("active");
  indicadores[carrusel.slideActual].classList.remove("active");

  // Cambiar al slide seleccionado
  carrusel.slideActual = index;

  // Activar nuevo slide
  slides[carrusel.slideActual].classList.add("active");
  indicadores[carrusel.slideActual].classList.add("active");

  // Actualizar contador
  contadorActual.textContent = carrusel.slideActual + 1;
}

// Función para inicializar contadores de comentarios en publicaciones existentes
function inicializarContadoresComentarios() {
  // Actualizar contadores para todas las publicaciones que tienen comentarios
  Object.keys(comentariosPorPublicacion).forEach((publicacionId) => {
    actualizarContadorComentarios(publicacionId);
  });
}

// ==================== FunciónONES DE COMENTARIOS ====================

// Constante para el almacenamiento de comentarios
const COMENTARIOS_STORAGE_KEY = "gnet_comentarios";

// Función para cargar comentarios desde localStorage
function cargarComentarios() {
  try {
    const comentariosGuardados = localStorage.getItem(COMENTARIOS_STORAGE_KEY);
    if (comentariosGuardados) {
      const comentarios = JSON.parse(comentariosGuardados);
      // Convertir fechas de string a Date objects
      Object.keys(comentarios).forEach((pubId) => {
        comentarios[pubId].forEach((comentario) => {
          comentario.fecha = new Date(comentario.fecha);
        });
      });
      return comentarios;
    }
  } catch (error) {
    console.error("Error al cargar comentarios:", error);
  }

  // Retornar comentarios de ejemplo si no hay guardados
  return {
    pub_ejemplo_1: [
      {
        id: "comment_ejemplo_1",
        texto: "¡Excelente información! Muy útil para planificar el semestre.",
        autor: "María Estudiante",
        handle: "@maria.est",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
        likes: 5,
        liked: false,
      },
      {
        id: "comment_ejemplo_2",
        texto: "¿Ya está disponible para descargar el calendario completo?",
        autor: "Carlos Admin",
        handle: "@carlos.admin",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 1 * 60 * 60 * 1000), // hace 1 hora
        likes: 2,
        liked: true,
      },
      {
        id: "comment_ejemplo_3",
        texto: "Gracias por mantener a la comunidad informada 👍",
        autor: "Ana Profesora",
        handle: "@ana.prof",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 30 * 60 * 1000), // hace 30 minutos
        likes: 8,
        liked: false,
      },
      {
        id: "comment_ejemplo_4",
        texto:
          "Muy importante tener estas fechas claras desde el inicio del período.",
        autor: "Roberto Coordinador",
        handle: "@roberto.coord",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 20 * 60 * 1000), // hace 20 minutos
        likes: 3,
        liked: false,
      },
      {
        id: "comment_ejemplo_5",
        texto: "¿Las fechas de exámenes finales también están incluidas?",
        autor: "Sofía Estudiante",
        handle: "@sofia.est",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 15 * 60 * 1000), // hace 15 minutos
        likes: 1,
        liked: false,
      },
      {
        id: "comment_ejemplo_6",
        texto:
          "Perfecto para organizar mi horario de estudio durante el semestre.",
        autor: "Diego Alumno",
        handle: "@diego.alumno",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 10 * 60 * 1000), // hace 10 minutos
        likes: 4,
        liked: true,
      },
      {
        id: "comment_ejemplo_7",
        texto: "Recomiendo imprimir el calendario y pegarlo en el escritorio.",
        autor: "Patricia Secretaria",
        handle: "@patricia.sec",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 5 * 60 * 1000), // hace 5 minutos
        likes: 6,
        liked: false,
      },
      {
        id: "comment_ejemplo_8",
        texto:
          "Gracias a todos por sus comentarios. El calendario estará disponible pronto.",
        autor: "UFG",
        handle: "@ufg",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 2 * 60 * 1000), // hace 2 minutos
        likes: 3,
        liked: false,
      },
      {
        id: "comment_ejemplo_9",
        texto: "Estaremos compartiendo más información académica regularmente.",
        autor: "UFG",
        handle: "@ufg",
        avatar: "/publicaciones/UFGPerfil.jpg",
        fecha: new Date(Date.now() - 1 * 60 * 1000), // hace 1 minuto
        likes: 1,
        liked: false,
      },
    ],
  };
}

// Función para guardar comentarios en localStorage
function guardarComentarios() {
  try {
    localStorage.setItem(
      COMENTARIOS_STORAGE_KEY,
      JSON.stringify(comentariosPorPublicacion),
    );
    console.log("💬 Comentarios guardados");
  } catch (error) {
    console.error("Error al guardar comentarios:", error);
  }
}

// Función para generar HTML de la sección de comentarios (para templates)
function generarHTMLComentarios(publicacionId) {
  return `
        <div id="comentarios-${publicacionId}" class="seccion-comentarios" style="display: none;">
            <div class="contador-comentarios">
                <span id="count-${publicacionId}">0</span> comentarios
            </div>
            
            <!-- Formulario para Agregar comentario -->
            <div class="formulario-comentario">
                <div class="avatar-comentario">
                    <img src="${obtenerDatosUsuario().avatar}" alt="Tu avatar">
                </div>
                <div class="input-comentario">
                    <textarea 
                        id="campo-comentario-${publicacionId}" 
                        class="campo-comentario" 
                        placeholder="Escribe un comentario..."
                        maxlength="500"
                        rows="1"
                    ></textarea>
                    <div class="acciones-comentario">
                        <button class="btn-comentario" onclick="publicarComentario('${publicacionId}')">
                            Comentar
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Lista de comentarios -->
            <div id="lista-comentarios-${publicacionId}" class="lista-comentarios">
                <!-- Los comentarios se cargarán aquí -->
            </div>
        </div>
    `;
}

// Variable para almacenar comentarios (se carga desde localStorage)
let comentariosPorPublicacion = {};

// Inicializar comentarios al cargar la página
function inicializarComentarios() {
  comentariosPorPublicacion = cargarComentarios();
  console.log("💬 Comentarios inicializados:", comentariosPorPublicacion);
}

// Función para alternar la visibilidad de los comentarios
function toggleComentarios(publicacionId) {
  const seccionComentarios = document.getElementById(
    `comentarios-${publicacionId}`,
  );
  const botonComentarios = document.querySelector(
    `[onclick*="'${publicacionId}'"]`,
  );

  if (!seccionComentarios) {
    console.warn("Sección de comentarios no encontrada para:", publicacionId);
    return;
  }

  if (
    seccionComentarios.style.display === "none" ||
    seccionComentarios.style.display === ""
  ) {
    seccionComentarios.style.display = "block";

    // Configurar auto-resize para el textarea si no está configurado
    const textarea = seccionComentarios.querySelector(".campo-comentario");
    if (textarea && !textarea.hasAttribute("data-configured")) {
      textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 100) + "px";
      });
      textarea.setAttribute("data-configured", "true");
    }

    // Cargar comentarios
    cargarComentarios(publicacionId);
  } else {
    seccionComentarios.style.display = "none";
  }
}

// Función para crear la sección de comentarios
function crearSeccionComentarios(publicacionId) {
  const publicacion = document.getElementById(publicacionId);
  if (!publicacion) return;

  const separador = publicacion.querySelector(".separador");
  if (!separador) return;

  // Crear HTML de la sección de comentarios
  const seccionComentarios = document.createElement("div");
  seccionComentarios.id = `comentarios-${publicacionId}`;
  seccionComentarios.className = "seccion-comentarios";
  seccionComentarios.innerHTML = `
        <div class="contador-comentarios">
            <span id="count-${publicacionId}">0</span> comentarios
        </div>
        
        <!-- Formulario para Agregar comentario -->
        <div class="formulario-comentario">
            <div class="avatar-comentario">
                <img src="${obtenerDatosUsuario().avatar}" alt="Tu avatar">
            </div>
            <div class="input-comentario">
                <textarea 
                    id="campo-comentario-${publicacionId}" 
                    class="campo-comentario" 
                    placeholder="Escribe un comentario..."
                    maxlength="500"
                    rows="1"
                ></textarea>
                <div class="acciones-comentario">
                    <button class="btn-cancelar" onclick="cancelarComentario('${publicacionId}')">
                        Cancelar
                    </button>
                    <button class="btn-comentario" onclick="publicarComentario('${publicacionId}')">
                        Comentar
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de comentarios -->
        <div id="lista-comentarios-${publicacionId}" class="lista-comentarios">
            <!-- Los comentarios se cargarán aquí -->
        </div>
    `;

  // Insertar después del separador
  separador.parentNode.insertBefore(seccionComentarios, separador.nextSibling);

  // Configurar auto-resize para el textarea
  const textarea = seccionComentarios.querySelector(".campo-comentario");
  textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  });

  // Cargar comentarios existentes
  cargarComentarios(publicacionId);
}

// Función para publicar un comentario
function publicarComentario(publicacionId) {
  console.log("🎯 Iniciando publicarComentario para:", publicacionId);

  // Verificar que la variable esté inicializada
  if (!comentariosPorPublicacion) {
    console.error("❌ comentariosPorPublicacion no está inicializada");
    comentariosPorPublicacion = {};
  }

  const campoComentario = document.getElementById(
    `campo-comentario-${publicacionId}`,
  );
  if (!campoComentario) {
    console.error(
      "❌ Campo de comentario no encontrado:",
      `campo-comentario-${publicacionId}`,
    );
    return;
  }

  const textoComentario = campoComentario.value.trim();
  console.log("📝 Texto del comentario:", textoComentario);

  if (textoComentario === "") {
    alert("Escribe algo para comentar");
    campoComentario.focus();
    return;
  }

  // Obtener datos del usuario actual
  const datosUsuario = obtenerDatosUsuario();
  console.log("👤 Datos del usuario:", datosUsuario);

  // Crear objeto de comentario
  const nuevoComentario = {
    id: "comment_" + Date.now(),
    texto: textoComentario,
    autor: datosUsuario.username,
    handle: datosUsuario.handle,
    avatar: datosUsuario.avatar,
    fecha: new Date(),
    likes: 0,
    liked: false,
  };

  console.log("💬 Nuevo comentario creado:", nuevoComentario);

  // Agregar comentario al storage
  if (!comentariosPorPublicacion[publicacionId]) {
    comentariosPorPublicacion[publicacionId] = [];
  }
  comentariosPorPublicacion[publicacionId].unshift(nuevoComentario);

  console.log(
    "📦 Comentarios actualizados:",
    comentariosPorPublicacion[publicacionId],
  );

  // Verificar que el objeto se guardó correctamente
  if (!comentariosPorPublicacion[publicacionId]) {
    console.error(
      "❌ Error: No se pudo crear el array de comentarios para:",
      publicacionId,
    );
    return;
  }

  // Guardar comentarios en localStorage
  guardarComentarios();

  // Actualizar datos empaquetados de la publicación específica
  actualizarDatosPublicacion(publicacionId, nuevoComentario);

  // Limpiar campo
  campoComentario.value = "";
  campoComentario.style.height = "auto";

  // Asegurar que la sección de comentarios esté visible
  const seccionComentarios = document.getElementById(
    `comentarios-${publicacionId}`,
  );
  if (seccionComentarios && seccionComentarios.style.display === "none") {
    seccionComentarios.style.display = "block";
    console.log("🔓 Sección de comentarios abierta automáticamente");
  }

  // Actualizar contador en el botón
  actualizarContadorComentarios(publicacionId);

  // Recargar comentarios en la UI
  cargarComentarios(publicacionId);

  console.log("💬 Comentario publicado y guardado:", nuevoComentario);
}

// Función para actualizar los datos empaquetados de una publicación específica
function actualizarDatosPublicacion(publicacionId, nuevoComentario = null) {
  const publicacion = document.getElementById(publicacionId);
  if (!publicacion) {
    console.warn(
      "⚠️ No se encontró la publicación para actualizar:",
      publicacionId,
    );
    return;
  }

  try {
    // Obtener datos actuales de la publicación
    let datosPublicacion = null;
    if (publicacion.dataset.publicacionCompleta) {
      datosPublicacion = JSON.parse(publicacion.dataset.publicacionCompleta);
    } else {
      // Crear estructura básica si no existe
      datosPublicacion = {
        id: publicacionId,
        comentarios: [],
      };
    }

    // Actualizar comentarios con los del objeto global
    if (comentariosPorPublicacion[publicacionId]) {
      datosPublicacion.comentarios = [
        ...comentariosPorPublicacion[publicacionId],
      ];
    }

    // Guardar datos actualizados en el elemento
    publicacion.dataset.publicacionCompleta = JSON.stringify(datosPublicacion);

    console.log(
      `📦 Datos de publicación ${publicacionId} actualizados:`,
      datosPublicacion.comentarios.length,
      "comentarios",
    );

    // Los datos se mantienen sincronizados con el backend
  } catch (error) {
    console.error("❌ Error al actualizar datos de publicación:", error);
  }
}

// Función para migrar comentarios existentes a las publicaciones
function migrarComentariosAPublicaciones() {
  console.log("🔄 Migrando comentarios existentes a publicaciones...");

  // Obtener todas las publicaciones dinámicas (no ejemplos)
  const publicaciones = document.querySelectorAll(
    ".publicacion:not(#pub_ejemplo_1):not(#pub_ejemplo_2)",
  );

  publicaciones.forEach((publicacion) => {
    const publicacionId = publicacion.id;
    if (comentariosPorPublicacion[publicacionId]) {
      console.log(
        `📦 Migrando ${comentariosPorPublicacion[publicacionId].length} comentarios para ${publicacionId}`,
      );
      actualizarDatosPublicacion(publicacionId);
    }
  });

  console.log("✅ Migración de comentarios completada");
}

// Función para cancelar comentario
function cancelarComentario(publicacionId) {
  const campoComentario = document.getElementById(
    `campo-comentario-${publicacionId}`,
  );
  campoComentario.value = "";
  campoComentario.style.height = "auto";
  campoComentario.blur();
}

// Función para cargar comentarios
function cargarComentarios(publicacionId) {
  console.log("🔄 Cargando comentarios para:", publicacionId);

  const listaComentarios = document.getElementById(
    `lista-comentarios-${publicacionId}`,
  );
  const contadorComentarios = document.getElementById(`count-${publicacionId}`);

  console.log("🎯 Elementos encontrados:", {
    listaComentarios: listaComentarios ? "Sí" : "NO",
    contadorComentarios: contadorComentarios ? "Sí" : "NO",
  });

  if (!listaComentarios || !contadorComentarios) {
    console.error("❌ Elementos no encontrados para:", publicacionId);
    return;
  }

  const comentarios = comentariosPorPublicacion[publicacionId] || [];
  console.log("📊 Comentarios a mostrar:", comentarios.length);

  contadorComentarios.textContent = comentarios.length;

  if (comentarios.length === 0) {
    listaComentarios.innerHTML =
      '<div class="sin-comentarios">Sé el primero en comentar</div>';
    return;
  }

  // Generar HTML de comentarios
  listaComentarios.innerHTML = comentarios
    .map((comentario) => {
      const datosUsuario = obtenerDatosUsuario();
      const esComentarioPropio = comentario.handle === datosUsuario.handle; // Verificar si es comentario del usuario actual

      return `
        <div class="comentario" id="${comentario.id}">
            <div class="avatar-comentario">
                <img src="${comentario.avatar}" alt="Avatar de ${comentario.autor}">
            </div>
            <div class="comentario-contenido">
                <div class="comentario-header">
                    <span class="comentario-autor">${comentario.autor}</span>
                    <span class="comentario-handle">${comentario.handle}</span>
                    <span class="comentario-tiempo">${formatearTiempo(comentario.fecha)}</span>
                    ${
                      esComentarioPropio
                        ? `
                        <div class="comentario-menu">
                            <button class="btn-menu-comentario" onclick="toggleMenuComentario('${comentario.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </button>
                            <div class="menu-dropdown" id="menu-${comentario.id}">
                                <button class="menu-opcion eliminar" onclick="eliminarComentario('${publicacionId}', '${comentario.id}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
                <div class="comentario-texto">${comentario.texto}</div>
                <div class="comentario-acciones">
                    <button class="accion-comentario ${comentario.liked ? "liked" : ""}" 
                            onclick="toggleLikeComentario('${publicacionId}', '${comentario.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="${comentario.liked ? "currentColor" : "none"}" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span>${comentario.likes}</span>
                    </button>
                    <button class="accion-comentario" onclick="responderComentario('${publicacionId}', '${comentario.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                        Responder
                    </button>
                </div>
            </div>
        </div>
        `;
    })
    .join("");

  console.log("✅ Comentarios cargados en la UI:", comentarios.length);

  // Verificar si hay scroll y Agregar clase para el indicador de fade
  setTimeout(() => {
    if (listaComentarios.scrollHeight > listaComentarios.clientHeight) {
      listaComentarios.classList.add("has-scroll");
    } else {
      listaComentarios.classList.remove("has-scroll");
    }
  }, 100);
}

// Función para dar like a un comentario
function toggleLikeComentario(publicacionId, comentarioId) {
  const comentarios = comentariosPorPublicacion[publicacionId];
  if (!comentarios) return;

  const comentario = comentarios.find((c) => c.id === comentarioId);
  if (!comentario) return;

  if (comentario.liked) {
    comentario.likes = Math.max(0, comentario.likes - 1);
    comentario.liked = false;
  } else {
    comentario.likes++;
    comentario.liked = true;
  }

  // Guardar comentarios en localStorage
  guardarComentarios();

  // Recargar comentarios para actualizar la UI
  cargarComentarios(publicacionId);
}

// Función para responder a un comentario
function responderComentario(publicacionId, comentarioId) {
  const campoComentario = document.getElementById(
    `campo-comentario-${publicacionId}`,
  );
  const comentarios = comentariosPorPublicacion[publicacionId];

  if (!comentarios || !campoComentario) return;

  const comentario = comentarios.find((c) => c.id === comentarioId);
  if (!comentario) return;

  // Agregar mención al campo de comentario
  campoComentario.value = `${comentario.handle} `;
  campoComentario.focus();

  // Posicionar cursor al final
  campoComentario.setSelectionRange(
    campoComentario.value.length,
    campoComentario.value.length,
  );
}

// Función para actualizar contador de comentarios en el botón
function actualizarContadorComentarios(publicacionId) {
  // Buscar el botón de comentarios por diferentes métodos
  let botonComentarios = document.querySelector(
    `[data-publicacion="${publicacionId}"][data-accion="comentar"]`,
  );

  if (!botonComentarios) {
    // Buscar por onclick que contenga alternarComentarios
    botonComentarios = document.querySelector(
      `[onclick*="alternarComentarios('${publicacionId}')"]`,
    );
  }

  if (!botonComentarios) {
    // Buscar en la publicación específica
    const publicacion = document.getElementById(publicacionId);
    if (publicacion) {
      botonComentarios = publicacion.querySelector(".comentarios");
    }
  }

  if (!botonComentarios) return;

  const contador = botonComentarios.querySelector("span");
  const numeroComentarios = (comentariosPorPublicacion[publicacionId] || [])
    .length;

  if (contador) {
    contador.textContent = numeroComentarios;
  }
}

// Función para mostrar/ocultar menú de opciones de comentario
function toggleMenuComentario(comentarioId) {
  const menu = document.getElementById(`menu-${comentarioId}`);
  if (!menu) return;

  // Cerrar otros menús abiertos
  document.querySelectorAll(".menu-dropdown.visible").forEach((otroMenu) => {
    if (otroMenu.id !== `menu-${comentarioId}`) {
      otroMenu.classList.remove("visible");
    }
  });

  // Toggle del menú actual
  menu.classList.toggle("visible");

  // Cerrar menú al hacer click fuera
  if (menu.classList.contains("visible")) {
    setTimeout(() => {
      document.addEventListener("click", function cerrarMenu(e) {
        if (
          !menu.contains(e.target) &&
          !e.target.closest(".btn-menu-comentario")
        ) {
          menu.classList.remove("visible");
          document.removeEventListener("click", cerrarMenu);
        }
      });
    }, 100);
  }
}

// Función para eliminar comentario (eliminación directa y silenciosa)
function eliminarComentario(publicacionId, comentarioId) {
  const comentarios = comentariosPorPublicacion[publicacionId];
  if (!comentarios) return;

  // Verificar que el comentario pertenece al usuario actual
  const comentario = comentarios.find((c) => c.id === comentarioId);
  if (!comentario || comentario.handle !== "@ufg") {
    // Eliminación silenciosa - no mostrar mensaje de error
    return;
  }

  // Animar eliminación inmediatamente
  const elementoComentario = document.getElementById(comentarioId);
  if (elementoComentario) {
    elementoComentario.style.transition = "all 0.3s ease";
    elementoComentario.style.opacity = "0";
    elementoComentario.style.transform = "translateX(-20px)";

    setTimeout(() => {
      // Eliminar comentario del array
      const index = comentarios.findIndex((c) => c.id === comentarioId);
      if (index !== -1) {
        comentarios.splice(index, 1);

        // Guardar comentarios en localStorage
        guardarComentarios();

        // Actualizar contador en el botón
        actualizarContadorComentarios(publicacionId);

        // Recargar comentarios
        cargarComentarios(publicacionId);

        console.log("💬 Comentario eliminado y guardado:", comentarioId);
      }
    }, 300);
  }

  // Cerrar menú inmediatamente
  const menusAbiertos = document.querySelectorAll(".menu-dropdown.activo");
  menusAbiertos.forEach((menu) => menu.classList.remove("activo"));
}

// Función para formatear tiempo relativo
function formatearTiempo(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  const semanas = Math.floor(dias / 7);
  const meses = Math.floor(dias / 30);
  const años = Math.floor(dias / 365);

  if (segundos < 30) return "ahora";
  if (segundos < 60) return "hace unos segundos";
  if (minutos === 1) return "hace 1 min";
  if (minutos < 60) return `hace ${minutos} min`;
  if (horas === 1) return "hace 1 hora";
  if (horas < 24) return `hace ${horas} horas`;
  if (dias === 1) return "hace 1 día";
  if (dias < 7) return `hace ${dias} días`;
  if (semanas === 1) return "hace 1 semana";
  if (semanas < 4) return `hace ${semanas} semanas`;
  if (meses === 1) return "hace 1 mes";
  if (meses < 12) return `hace ${meses} meses`;
  if (años === 1) return "hace 1 año";
  if (años > 1) return `hace ${años} años`;

  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: fecha.getFullYear() !== ahora.getFullYear() ? "numeric" : undefined,
  });
}

// ==================== FunciónONES DE ENCUESTAS ====================

// Variable para almacenar datos de encuesta
let encuestaActual = null;

// Función para abrir el creador de encuestas
function abrirCreadorEncuesta() {
  const creadorEncuesta = document.getElementById("creador-encuesta");

  // Limpiar datos anteriores
  document.getElementById("pregunta-encuesta").value = "";
  const opciones = document.querySelectorAll(".opcion-input input");
  opciones.forEach((input) => (input.value = ""));

  // Resetear a 2 opciones
  const opcionesContainer = document.querySelector(".opciones-encuesta");
  const todasLasOpciones = opcionesContainer.querySelectorAll(".opcion-input");
  todasLasOpciones.forEach((opcion, index) => {
    if (index >= 2) {
      opcion.remove();
    }
  });

  // Limpiar encuesta actual si existe
  encuestaActual = null;

  // Mostrar creador
  creadorEncuesta.style.display = "block";
  setTimeout(() => {
    creadorEncuesta.classList.add("visible");
  }, 10);

  // Enfocar en la pregunta
  document.getElementById("pregunta-encuesta").focus();
}

// Función para cerrar el creador de encuestas
function cerrarCreadorEncuesta(limpiarEncuesta = true) {
  const creadorEncuesta = document.getElementById("creador-encuesta");
  creadorEncuesta.classList.remove("visible");
  setTimeout(() => {
    creadorEncuesta.style.display = "none";
  }, 300);

  // Solo limpiar datos si se especifica (no cuando se está creando una encuesta)
  if (limpiarEncuesta) {
    encuestaActual = null;
  }
}

// Función para Agregar una nueva opción
function AgregarOpcion() {
  const opcionesContainer = document.querySelector(".opciones-encuesta");
  const opcionesActuales = opcionesContainer.querySelectorAll(".opcion-input");

  // Máximo 6 opciones
  if (opcionesActuales.length >= 6) {
    alert("Máximo 6 opciones permitidas");
    return;
  }

  const numeroOpcion = opcionesActuales.length + 1;
  const nuevaOpcion = document.createElement("div");
  nuevaOpcion.className = "opcion-input";
  nuevaOpcion.innerHTML = `
        <input type="text" placeholder="Opción ${numeroOpcion}" maxlength="100">
        <button class="btn-eliminar-opcion" onclick="eliminarOpcion(this)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="12" height="12">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        </button>
    `;

  opcionesContainer.appendChild(nuevaOpcion);

  // Mostrar botones de eliminar si hay más de 2 opciones
  actualizarBotonesEliminar();

  // Enfocar en la nueva opción
  nuevaOpcion.querySelector("input").focus();
}

// Función para eliminar una opción
function eliminarOpcion(boton) {
  const opcion = boton.parentElement;
  const opcionesContainer = document.querySelector(".opciones-encuesta");
  const opcionesActuales = opcionesContainer.querySelectorAll(".opcion-input");

  // Mínimo 2 opciones
  if (opcionesActuales.length <= 2) {
    return;
  }

  opcion.remove();
  actualizarBotonesEliminar();
  actualizarPlaceholders();
}

// Función para actualizar la visibilidad de botones eliminar
function actualizarBotonesEliminar() {
  const opcionesContainer = document.querySelector(".opciones-encuesta");
  const opciones = opcionesContainer.querySelectorAll(".opcion-input");
  const botones = opcionesContainer.querySelectorAll(".btn-eliminar-opcion");

  botones.forEach((boton) => {
    boton.style.display = opciones.length > 2 ? "flex" : "none";
  });
}

// Función para actualizar placeholders
function actualizarPlaceholders() {
  const opciones = document.querySelectorAll(".opcion-input input");
  opciones.forEach((input, index) => {
    input.placeholder = `Opción ${index + 1}`;
  });
}

// Función para validar y crear encuesta
function crearEncuesta() {
  const pregunta = document.getElementById("pregunta-encuesta").value.trim();
  const duracion = document.getElementById("duracion-encuesta").value;
  const opciones = Array.from(document.querySelectorAll(".opcion-input input"))
    .map((input) => input.value.trim())
    .filter((texto) => texto.length > 0);

  // Validaciones
  if (!pregunta) {
    alert("Debes escribir una pregunta para la encuesta");
    document.getElementById("pregunta-encuesta").focus();
    return false;
  }

  if (opciones.length < 2) {
    alert("Debes tener al menos 2 opciones para la encuesta");
    return false;
  }

  // Crear objeto de encuesta
  encuestaActual = {
    pregunta: pregunta,
    opciones: opciones.map((opcion) => ({
      texto: opcion,
      votos: 0,
    })),
    duracionHoras: parseInt(duracion),
    fechaCreacion: new Date(),
    votantes: [], // IDs de usuarios que han votado
    totalVotos: 0,
  };

  console.log("Encuesta creada:", encuestaActual);

  // Mostrar indicador de encuesta creada
  mostrarIndicadorEncuesta(encuestaActual);

  // Cerrar el creador sin limpiar la encuesta
  cerrarCreadorEncuesta(false);
  return true;
}

// Función para votar en una encuesta
function votarEnEncuesta(encuestaId, opcionIndex) {
  const userId = "usuario_actual"; // En una app real sería el ID del usuario logueado
  const encuesta = document.getElementById(encuestaId);

  if (!encuesta) {
    console.error("Encuesta no encontrada:", encuestaId);
    return;
  }

  let datosEncuesta;
  try {
    const dataAttr = encuesta.dataset.encuesta.replace(/&apos;/g, "'");
    datosEncuesta = JSON.parse(dataAttr);
  } catch (error) {
    console.error("Error al parsear datos de encuesta:", error);
    return;
  }

  // Verificar si ya votó
  if (datosEncuesta.votantes.includes(userId)) {
    alert("Ya has votado en esta encuesta");
    return;
  }

  // Verificar si la encuesta ha expirado
  if (
    encuestaExpirada(
      new Date(datosEncuesta.fechaCreacion),
      datosEncuesta.duracionHoras,
    )
  ) {
    alert("Esta encuesta ya ha expirado");
    return;
  }

  // Registrar voto
  datosEncuesta.opciones[opcionIndex].votos++;
  datosEncuesta.totalVotos++;
  datosEncuesta.votantes.push(userId);

  // Actualizar dataset
  encuesta.dataset.encuesta = JSON.stringify(datosEncuesta).replace(
    /'/g,
    "&apos;",
  );

  // Actualizar visualización
  actualizarResultadosEncuesta(encuestaId, datosEncuesta);

  // Marcar todas las opciones como votadas (deshabilitar futuras votaciones)
  const opciones = encuesta.querySelectorAll(".opcion-encuesta");
  opciones.forEach((opcion) => {
    opcion.classList.add("votada");
    opcion.style.cursor = "not-allowed";
    opcion.onclick = null;
  });
}

// Función para actualizar los resultados visuales de la encuesta
function actualizarResultadosEncuesta(encuestaId, datosEncuesta) {
  const encuesta = document.getElementById(encuestaId);
  if (!encuesta) {
    console.error("No se encontró la encuesta con ID:", encuestaId);
    return;
  }

  const opciones = encuesta.querySelectorAll(".opcion-encuesta");

  opciones.forEach((opcion, index) => {
    const porcentajeElement = opcion.querySelector(".porcentaje-votos");
    const numeroVotosElement = opcion.querySelector(".numero-votos");
    const barraProgreso = opcion.querySelector(".barra-progreso");

    if (!porcentajeElement || !numeroVotosElement || !barraProgreso) {
      console.error("No se encontraron elementos de la opción:", index);
      return;
    }

    const votos = datosEncuesta.opciones[index].votos;
    const porcentaje =
      datosEncuesta.totalVotos > 0
        ? Math.round((votos / datosEncuesta.totalVotos) * 100)
        : 0;

    porcentajeElement.textContent = `${porcentaje}%`;
    numeroVotosElement.textContent = `${votos} voto${votos !== 1 ? "s" : ""}`;

    // Animar la barra de progreso
    setTimeout(() => {
      barraProgreso.style.width = `${porcentaje}%`;
    }, 100);

    // Deshabilitar clic para futuras votaciones
    opcion.style.pointerEvents = "none";
    opcion.classList.add("votada");
  });

  // Actualizar total de votos
  const totalVotos = encuesta.querySelector(".total-votos");
  if (totalVotos) {
    totalVotos.textContent = `${datosEncuesta.totalVotos} voto${datosEncuesta.totalVotos !== 1 ? "s" : ""} totales`;
  }

  // Actualizar tiempo restante
  const tiempoRestanteElement = encuesta.querySelector(".tiempo-restante");
  if (tiempoRestanteElement) {
    const tiempoRestanteTexto = tiempoRestante(
      new Date(datosEncuesta.fechaCreacion),
      datosEncuesta.duracionHoras,
    );
    tiempoRestanteElement.textContent = tiempoRestanteTexto;
  }
}

// Función para verificar si una encuesta ha expirado
function encuestaExpirada(fechaCreacion, duracionHoras) {
  const ahora = new Date();
  const fechaExpiracion = new Date(
    fechaCreacion.getTime() + duracionHoras * 60 * 60 * 1000,
  );
  return ahora > fechaExpiracion;
}

// Función para obtener tiempo restante de encuesta
function tiempoRestante(fechaCreacion, duracionHoras) {
  const ahora = new Date();
  const fechaExpiracion = new Date(
    fechaCreacion.getTime() + duracionHoras * 60 * 60 * 1000,
  );
  const diferencia = fechaExpiracion - ahora;

  if (diferencia <= 0) return "Expirada";

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor(
    (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  if (dias > 0) return `${dias}d ${horas}h restantes`;
  if (horas > 0) return `${horas}h ${minutos}m restantes`;
  return `${minutos}m restantes`;
}

// Función para mostrar indicador de encuesta creada
function mostrarIndicadorEncuesta(encuesta) {
  const indicador = document.getElementById("indicador-encuesta");
  const preguntaPreview = document.getElementById("pregunta-preview");
  const opcionesPreview = document.getElementById("opciones-preview");
  const duracionPreview = document.getElementById("duracion-preview");

  if (!indicador || !preguntaPreview || !opcionesPreview || !duracionPreview) {
    console.error("No se encontraron elementos del indicador de encuesta");
    return;
  }

  // Llenar contenido del preview
  preguntaPreview.textContent = `Pregunta: ${encuesta.pregunta}`;
  opcionesPreview.textContent = `${encuesta.opciones.length} opciones: ${encuesta.opciones.map((o) => o.texto).join(", ")}`;
  duracionPreview.textContent = `Duración: ${encuesta.duracionHoras}h`;

  // Mostrar indicador
  indicador.style.display = "block";

  // Animar entrada
  setTimeout(() => {
    indicador.style.opacity = "1";
    indicador.style.transform = "translateY(0)";
  }, 10);
}

// Función para eliminar encuesta pendiente
function eliminarEncuestaPendiente() {
  const indicador = document.getElementById("indicador-encuesta");

  // Ocultar indicador
  indicador.style.display = "none";

  // Limpiar encuesta
  encuestaActual = null;

  console.log("Encuesta pendiente eliminada");
}

// Función para ocultar indicador de encuesta después de publicar
function ocultarIndicadorEncuesta() {
  const indicador = document.getElementById("indicador-encuesta");
  if (indicador) {
    indicador.style.display = "none";
  }
}

// Event listeners para Funciónonalidad de encuestas
document.addEventListener("DOMContentLoaded", function () {
  // Cerrar encuesta con Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const creadorEncuesta = document.getElementById("creador-encuesta");
      if (creadorEncuesta && creadorEncuesta.style.display !== "none") {
        cerrarCreadorEncuesta();
      }
    }
  });
});

// ==================== FunciónONES DE MENú DE PUBLICACIONES ====================

// Función para alternar menú de publicación
function toggleMenuPublicacion(publicacionId) {
  // Cerrar otros menús abiertos
  const otrosMenus = document.querySelectorAll(
    ".menu-dropdown-publicacion.activo",
  );
  otrosMenus.forEach((menu) => {
    if (menu.id !== `menu-pub-${publicacionId}`) {
      menu.classList.remove("activo");
    }
  });

  // Alternar el menú actual
  const menu = document.getElementById(`menu-pub-${publicacionId}`);
  if (menu) {
    menu.classList.toggle("activo");
  }
}

// Función para eliminar publicación
function eliminarPublicacion(publicacionId) {
  // Verificar que sea una publicación propia (en este caso todas son de @ufg)
  const elementoPublicacion = document.getElementById(publicacionId);
  if (!elementoPublicacion) return;

  // Animar eliminación
  elementoPublicacion.style.transition = "all 0.4s ease";
  elementoPublicacion.style.opacity = "0";
  elementoPublicacion.style.transform = "translateX(-30px) scale(0.95)";

  setTimeout(() => {
    // Buscar el contenedor padre de la publicación
    const contenedorPublicacion = elementoPublicacion.closest(
      ".contenedor-publicacion",
    );
    if (contenedorPublicacion) {
      contenedorPublicacion.remove();
    } else {
      elementoPublicacion.remove();
    }

    // Los datos se sincronizarán automáticamente con el backend
    console.log("Publicación eliminada:", publicacionId);
  }, 400);

  // Cerrar menú inmediatamente
  const menusAbiertos = document.querySelectorAll(
    ".menu-dropdown-publicacion.activo",
  );
  menusAbiertos.forEach((menu) => menu.classList.remove("activo"));
}

// Función para alternar me gusta (like) en una publicación
async function alternarMeGusta(botonElement, publicacionId) {
  try {
    // Verificar si el botón ya tiene like
    const tieneActiveLike = botonElement.classList.contains("liked");
    const spanContador = botonElement.querySelector("span");
    const svgElement = botonElement.querySelector("svg");

    let nuevoConteo = parseInt(spanContador.textContent) || 0;

    if (backendConectado && usarBackend) {
      // Usar backend
      let resultado;

      if (tieneActiveLike) {
        // Quitar like
        resultado = await quitarLikeBackend(publicacionId);
        if (resultado) {
          nuevoConteo = resultado.likes;
          botonElement.classList.remove("liked");
          svgElement.setAttribute("fill", "none");
        } else {
          console.warn("No se pudo quitar like en backend");
          return;
        }
      } else {
        // Dar like
        resultado = await darLikeBackend(publicacionId);
        if (resultado) {
          nuevoConteo = resultado.likes;
          botonElement.classList.add("liked");
          svgElement.setAttribute("fill", "currentColor");
        } else {
          console.warn("No se pudo dar like en backend");
          return;
        }
      }
    } else {
      // Usar localStorage (Funciónonalidad local)
      const datosUsuario = obtenerDatosUsuario();
      const claveUsuario = datosUsuario.handle; // Identificador único del usuario

      // Cargar likes del usuario actual
      const likesLocales = JSON.parse(
        localStorage.getItem("gnet_likes") || "{}",
      );
      const likesUsuario = likesLocales[claveUsuario] || {};

      console.log("💾 Likes actuales del usuario antes:", likesUsuario);

      // Verificar si el usuario ya dio like a esta publicación
      const yaLeDioLike = likesUsuario[publicacionId] === true;

      console.log(
        `🤔 Usuario ${claveUsuario} ya dio like a ${publicacionId}: ${yaLeDioLike}`,
      );

      if (tieneActiveLike && yaLeDioLike) {
        // No permitir quitar like si ya lo dio (como Facebook)
        console.log(
          "👍 El usuario ya dio like a esta publicación, no puede quitarlo",
        );

        // Efecto visual para indicar que ya dio like
        botonElement.style.transform = "scale(1.1)";
        botonElement.style.filter = "brightness(1.2)";
        setTimeout(() => {
          botonElement.style.transform = "scale(1)";
          botonElement.style.filter = "brightness(1)";
        }, 200);

        return;
      } else if (!tieneActiveLike && !yaLeDioLike) {
        // Dar like (solo si no lo ha dado antes)
        nuevoConteo++;
        botonElement.classList.add("liked");
        svgElement.setAttribute("fill", "currentColor");

        // Marcar que este usuario ya dio like a esta publicación
        likesUsuario[publicacionId] = true;
        likesLocales[claveUsuario] = likesUsuario;

        console.log("💾 Guardando like del usuario:", {
          usuario: claveUsuario,
          publicacion: publicacionId,
          likesUsuario: likesUsuario,
          likesLocales: likesLocales,
        });

        // Guardar contadores globales
        const contadoresGlobales = JSON.parse(
          localStorage.getItem("gnet_contadores_likes") || "{}",
        );
        contadoresGlobales[publicacionId] = nuevoConteo;
        localStorage.setItem(
          "gnet_contadores_likes",
          JSON.stringify(contadoresGlobales),
        );

        console.log("📊 Contadores globales actualizados:", contadoresGlobales);
      } else {
        // El usuario ya dio like, no hacer nada
        console.log("👍 El usuario ya interactuó con esta publicación");

        // Efecto visual para indicar que ya dio like
        botonElement.style.transform = "scale(1.1)";
        botonElement.style.filter = "brightness(1.2)";
        setTimeout(() => {
          botonElement.style.transform = "scale(1)";
          botonElement.style.filter = "brightness(1)";
        }, 200);

        return;
      }

      // Guardar los likes del usuario
      localStorage.setItem("gnet_likes", JSON.stringify(likesLocales));

      console.log(
        "✅ Likes guardados en localStorage:",
        JSON.stringify(likesLocales, null, 2),
      );
    }

    // Actualizar el contador en la UI
    spanContador.textContent = nuevoConteo;

    // Efecto visual de animación
    botonElement.style.transform = "scale(1.1)";
    setTimeout(() => {
      botonElement.style.transform = "scale(1)";
    }, 150);
  } catch (error) {
    console.error("Error al alternar me gusta:", error);
    mostrarNotificacion("Error al procesar el like", "error");
  }
}

// Función para inicializar contadores de comentarios en publicaciones existentes
function inicializarContadoresComentariosExistentes() {
  // Actualizar contadores para todas las publicaciones
  Object.keys(comentariosPorPublicacion).forEach((publicacionId) => {
    actualizarContadorComentarios(publicacionId);
  });
}

// Alias para compatibilidad con las publicaciones dinámicas
function alternarComentarios(publicacionId) {
  return toggleComentarios(publicacionId);
}

// Función para inicializar estados de likes desde localStorage
function inicializarLikesPublicaciones() {
  const datosUsuario = obtenerDatosUsuario();
  const claveUsuario = datosUsuario.handle;

  console.log("🔍 Inicializando likes para usuario:", claveUsuario);

  // Cargar likes del usuario actual
  const likesLocales = JSON.parse(localStorage.getItem("gnet_likes") || "{}");
  const likesUsuario = likesLocales[claveUsuario] || {};

  console.log("📊 Likes del usuario cargados:", likesUsuario);

  // Cargar contadores globales
  const contadoresGlobales = JSON.parse(
    localStorage.getItem("gnet_contadores_likes") || "{}",
  );

  console.log("🔢 Contadores globales:", contadoresGlobales);

  // Aplicar estados guardados a todas las publicaciones
  const todasLasPublicaciones = document.querySelectorAll(
    '[id^="pub_"], [id^="ejemplo-"]',
  );

  console.log("📝 Publicaciones encontradas:", todasLasPublicaciones.length);

  todasLasPublicaciones.forEach((publicacion) => {
    const publicacionId = publicacion.id;
    const botonLike = publicacion.querySelector(".me-gusta");
    const svgElement = botonLike?.querySelector("svg");
    const spanContador = botonLike?.querySelector("span");

    if (botonLike && svgElement && spanContador) {
      // Verificar si este usuario ya dio like
      const usuarioYaDioLike = likesUsuario[publicacionId] === true;

      console.log(
        `👤 Publicación ${publicacionId}: Usuario ya dio like = ${usuarioYaDioLike}`,
      );

      if (usuarioYaDioLike) {
        botonLike.classList.add("liked");
        svgElement.setAttribute("fill", "currentColor");
        console.log(`❤️ Like aplicado a ${publicacionId}`);
      } else {
        botonLike.classList.remove("liked");
        svgElement.setAttribute("fill", "none");
        console.log(`🤍 Sin like en ${publicacionId}`);
      }

      // Mostrar contador global
      const contadorGlobal =
        contadoresGlobales[publicacionId] ||
        parseInt(spanContador.textContent) ||
        0;
      spanContador.textContent = contadorGlobal;
      console.log(`🔢 Contador de ${publicacionId}: ${contadorGlobal}`);
    }
  });

  console.log("👍 Likes inicializados para usuario:", claveUsuario);
}

// Función para inicializar like de una publicación específica
function inicializarLikePublicacion(publicacionId) {
  const datosUsuario = obtenerDatosUsuario();
  const claveUsuario = datosUsuario.handle;

  // Cargar likes del usuario actual
  const likesLocales = JSON.parse(localStorage.getItem("gnet_likes") || "{}");
  const likesUsuario = likesLocales[claveUsuario] || {};

  // Cargar contadores globales
  const contadoresGlobales = JSON.parse(
    localStorage.getItem("gnet_contadores_likes") || "{}",
  );

  const publicacion = document.getElementById(publicacionId);
  if (publicacion) {
    const botonLike = publicacion.querySelector(".me-gusta");
    const svgElement = botonLike?.querySelector("svg");
    const spanContador = botonLike?.querySelector("span");

    if (botonLike && svgElement && spanContador) {
      // Verificar si este usuario ya dio like
      const usuarioYaDioLike = likesUsuario[publicacionId] === true;

      if (usuarioYaDioLike) {
        botonLike.classList.add("liked");
        svgElement.setAttribute("fill", "currentColor");
      } else {
        botonLike.classList.remove("liked");
        svgElement.setAttribute("fill", "none");
      }

      // Mostrar contador global
      const contadorGlobal =
        contadoresGlobales[publicacionId] ||
        parseInt(spanContador.textContent) ||
        0;
      spanContador.textContent = contadorGlobal;
    }
  }
}

// Función para migrar likes del formato antiguo al nuevo (por usuario)
function migrarLikesAntiguos() {
  try {
    const likesAntiguos = localStorage.getItem("gnet_likes");
    if (likesAntiguos) {
      const datos = JSON.parse(likesAntiguos);
      const datosUsuario = obtenerDatosUsuario();
      const claveUsuario = datosUsuario.handle;

      // Verificar si ya está en el nuevo formato (tiene estructura de usuario)
      const primeraClave = Object.keys(datos)[0];
      if (
        primeraClave &&
        datos[primeraClave] &&
        typeof datos[primeraClave] === "object" &&
        (primeraClave.startsWith("@") ||
          typeof datos[primeraClave] !== "object" ||
          datos[primeraClave].liked === undefined)
      ) {
        // Ya está en formato nuevo o es formato mixto
        console.log("👍 Likes ya están en formato nuevo");
        return;
      }

      // Migrar del formato antiguo {publicacionId: {liked: true, count: X}}
      const nuevosLikes = {};
      const contadoresGlobales = {};

      Object.keys(datos).forEach((publicacionId) => {
        const like = datos[publicacionId];
        if (like && typeof like === "object" && like.liked === true) {
          // Si el usuario anterior tenía like, asignárselo al usuario actual
          if (!nuevosLikes[claveUsuario]) {
            nuevosLikes[claveUsuario] = {};
          }
          nuevosLikes[claveUsuario][publicacionId] = true;
        }
        contadoresGlobales[publicacionId] = like && like.count ? like.count : 0;
      });

      // Guardar en el nuevo formato
      localStorage.setItem("gnet_likes", JSON.stringify(nuevosLikes));
      localStorage.setItem(
        "gnet_contadores_likes",
        JSON.stringify(contadoresGlobales),
      );

      console.log("🔄 Likes migrados al nuevo formato para:", claveUsuario);
    }
  } catch (error) {
    console.error("Error al migrar likes antiguos:", error);
  }
}

// Event listener para cerrar menús al hacer clic fuera
document.addEventListener("click", function (event) {
  // Cerrar menús de publicaciones
  if (
    !event.target.closest(".menu-dropdown-publicacion") &&
    !event.target.closest(".btn-menu-publicacion")
  ) {
    const menusPublicacionAbiertos = document.querySelectorAll(
      ".menu-dropdown-publicacion.activo",
    );
    menusPublicacionAbiertos.forEach((menu) => {
      menu.classList.remove("activo");
    });
  }
});

// Función para ocultar la sección de perfil cuando se selecciona otra ventana
function ocultarSeccionPerfil() {
  const seccionPerfil = document.querySelector(".seccion-perfil");
  if (seccionPerfil) {
    seccionPerfil.style.display = "none";
  }
}

// Agregar event listeners para ocultar perfil cuando se cambia de sección
document.addEventListener("DOMContentLoaded", function () {
  // Botón de inicio
  const btnInicio = document.getElementById("inicio");
  if (btnInicio) {
    btnInicio.addEventListener("click", ocultarSeccionPerfil);
  }

  // Botón de marketplace
  const btnMarketplace = document.getElementById("btn-marketplace");
  if (btnMarketplace) {
    btnMarketplace.addEventListener("click", ocultarSeccionPerfil);
  }

  // Botón de comunidad
  const btnComunidad = document.getElementById("comunidad");
  if (btnComunidad) {
    btnComunidad.addEventListener("click", ocultarSeccionPerfil);
  }
});

// Funciónones adicionales para gestión de localStorage

// Función para limpiar manualmente todas las publicaciones guardadas
function limpiarPublicacionesGuardadas() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Todas las publicaciones han sido limpiadas del localStorage");

    // Opcional: recargar la página para ver solo las publicaciones de ejemplo
    // location.reload();

    return true;
  } catch (error) {
    console.error("Error al limpiar publicaciones:", error);
    return false;
  }
}

// Función para obtener estadísticas de publicaciones guardadas
function obtenerEstadisticasPublicaciones() {
  try {
    const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
    if (!publicacionesGuardadas) {
      return {
        total: 0,
        tamano: 0,
        antiguas: 0,
      };
    }

    const publicaciones = JSON.parse(publicacionesGuardadas);
    const ahora = Date.now();
    const unDiaEnMs = 24 * 60 * 60 * 1000;

    const antiguas = publicaciones.filter((pub) => {
      return ahora - pub.timestamp > unDiaEnMs * 7;
    }).length;

    return {
      total: publicaciones.length,
      tamano: new Blob([publicacionesGuardadas]).size,
      antiguas: antiguas,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return { total: 0, tamano: 0, antiguas: 0 };
  }
}

// Función para depurar - mostrar información en consola
function debugPublicaciones() {
  const stats = obtenerEstadisticasPublicaciones();
  console.log("📊 Estadísticas de Publicaciones:", {
    "Total guardadas": stats.total,
    "Tamaño en bytes": stats.tamano,
    "Publicaciones antiguas (>7 días)": stats.antiguas,
    "Memoria usada": (stats.tamano / 1024).toFixed(2) + " KB",
  });

  // Mostrar publicaciones guardadas
  try {
    const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
    if (publicacionesGuardadas) {
      const publicaciones = JSON.parse(publicacionesGuardadas);
      console.log(
        "📝 Publicaciones guardadas:",
        publicaciones.map((p) => ({
          id: p.id,
          fecha: new Date(p.timestamp).toLocaleString(),
          hace:
            ((Date.now() - p.timestamp) / (1000 * 60 * 60)).toFixed(1) +
            " horas",
        })),
      );
    }
  } catch (error) {
    console.error("Error en debug:", error);
  }
}

// Funciónones adicionales para gestión de comentarios

// Función para limpiar comentarios guardados
function limpiarComentariosGuardados() {
  try {
    localStorage.removeItem(COMENTARIOS_STORAGE_KEY);
    comentariosPorPublicacion = cargarComentarios();
    console.log("💬 Todos los comentarios han sido limpiados del localStorage");
    return true;
  } catch (error) {
    console.error("Error al limpiar comentarios:", error);
    return false;
  }
}

// Función para obtener estadísticas de comentarios
function obtenerEstadisticasComentarios() {
  try {
    const comentariosGuardados = localStorage.getItem(COMENTARIOS_STORAGE_KEY);
    let totalComentarios = 0;
    let publicacionesConComentarios = 0;

    Object.keys(comentariosPorPublicacion).forEach((pubId) => {
      if (
        comentariosPorPublicacion[pubId] &&
        comentariosPorPublicacion[pubId].length > 0
      ) {
        totalComentarios += comentariosPorPublicacion[pubId].length;
        publicacionesConComentarios++;
      }
    });

    return {
      total: totalComentarios,
      publicaciones: publicacionesConComentarios,
      tamano: comentariosGuardados ? new Blob([comentariosGuardados]).size : 0,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de comentarios:", error);
    return { total: 0, publicaciones: 0, tamano: 0 };
  }
}

// Agregar comandos de consola para debugging (opcional)
if (typeof window !== "undefined") {
  window.gnetDebug = {
    limpiarPublicaciones: limpiarPublicacionesGuardadas,
    estadisticas: obtenerEstadisticasPublicaciones,
    debug: debugPublicaciones,
    limpiarComentarios: limpiarComentariosGuardados,
    estadisticasComentarios: obtenerEstadisticasComentarios,
    debugCompleto: () => {
      const statsPublicaciones = obtenerEstadisticasPublicaciones();
      const statsComentarios = obtenerEstadisticasComentarios();
      console.log("📊 ESTADíSTICAS COMPLETAS G-NET:");
      console.log("📝 Publicaciones:", {
        "Total guardadas": statsPublicaciones.total,
        Tamaño: (statsPublicaciones.tamano / 1024).toFixed(2) + " KB",
        "Antiguas (>7 días)": statsPublicaciones.antiguas,
      });
      console.log("💬 Comentarios:", {
        "Total comentarios": statsComentarios.total,
        "Publicaciones con comentarios": statsComentarios.publicaciones,
        Tamaño: (statsComentarios.tamano / 1024).toFixed(2) + " KB",
      });
      console.log(
        "💾 Almacenamiento total:",
        ((statsPublicaciones.tamano + statsComentarios.tamano) / 1024).toFixed(
          2,
        ) + " KB",
      );
    },
    info: () => {
      console.log("🔧 Comandos disponibles:");
      console.log("- gnetDebug.debug() - Ver estadísticas de publicaciones");
      console.log(
        "- gnetDebug.estadisticas() - Obtener números básicos de publicaciones",
      );
      console.log(
        "- gnetDebug.limpiarPublicaciones() - Borrar todas las publicaciones guardadas",
      );
      console.log(
        "- gnetDebug.estadisticasComentarios() - Ver estadísticas de comentarios",
      );
      console.log(
        "- gnetDebug.limpiarComentarios() - Borrar todos los comentarios guardados",
      );
      console.log(
        "- gnetDebug.debugCompleto() - Ver estadísticas completas de todo el sistema",
      );
    },
  };
}

// ==================== FunciónONES DE PERFIL DE USUARIO ====================

// Función para manejar el clic en cambiar foto de perfil
function cambiarFotoPerfil() {
  const inputFoto = document.getElementById("input-foto-perfil");
  if (inputFoto) {
    inputFoto.click();
  }
}

// Función para procesar la nueva foto de perfil
function procesarNuevaFotoPerfil(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  // Validar que sea una imagen
  if (!archivo.type.startsWith("image/")) {
    mostrarAlertaError(
      "Error",
      "Por favor selecciona un archivo de imagen válido",
    );
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (archivo.size > 5 * 1024 * 1024) {
    mostrarAlertaError("Error", "La imagen es demasiado grande. Máximo 5MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const nuevaImagenUrl = e.target.result;

    // Actualizar preview en la sección de perfil
    const fotoPerfilPreview = document.getElementById("foto-perfil-preview");
    if (fotoPerfilPreview) {
      fotoPerfilPreview.src = nuevaImagenUrl;
    }

    // Actualizar todas las fotos de perfil en la página
    actualizarFotosPerfilEnPagina(nuevaImagenUrl);

    // Guardar en localStorage
    guardarNuevaFotoPerfil(nuevaImagenUrl);

    mostrarAlertaExito("¡éxito!", "Foto de perfil actualizada correctamente");
  };

  reader.onerror = function () {
    mostrarAlertaError("Error", "Error al procesar la imagen");
  };

  reader.readAsDataURL(archivo);
}

// Función para actualizar todas las fotos de perfil en la página
function actualizarFotosPerfilEnPagina(nuevaImagenUrl) {
  // Actualizar foto en el sidebar
  const avatarSidebar = document.querySelector(".mi-perfil .avatar img");
  if (avatarSidebar) {
    avatarSidebar.src = nuevaImagenUrl;
  }

  // Actualizar foto en todas las publicaciones del usuario actual
  const datosUsuario = obtenerDatosUsuario();
  const publicacionesUsuario = document.querySelectorAll(".publicacion");

  publicacionesUsuario.forEach((publicacion) => {
    const autorElement = publicacion.querySelector(".usuario-datos h4");
    if (autorElement && autorElement.textContent === datosUsuario.username) {
      const avatarImg = publicacion.querySelector(".usuario-info .avatar img");
      if (avatarImg) {
        avatarImg.src = nuevaImagenUrl;
      }
    }
  });

  // Actualizar foto en comentarios del usuario
  const comentariosUsuario = document.querySelectorAll(".comentario");
  comentariosUsuario.forEach((comentario) => {
    const autorComentario = comentario.querySelector(".comentario-autor");
    if (
      autorComentario &&
      autorComentario.textContent === datosUsuario.username
    ) {
      const avatarComentario = comentario.querySelector(
        ".comentario-avatar img",
      );
      if (avatarComentario) {
        avatarComentario.src = nuevaImagenUrl;
      }
    }
  });
}

// Función para guardar la nueva foto de perfil
function guardarNuevaFotoPerfil(imagenUrl) {
  const datosUsuario = obtenerDatosUsuario();

  // Actualizar los datos del usuario con la nueva imagen
  guardarDatosUsuarioLocales(
    datosUsuario.username,
    datosUsuario.handle,
    imagenUrl,
  );

  // Los datos se sincronizarán automáticamente con el backend
}

// Función para cargar foto de perfil al iniciar
function cargarFotoPerfilInicial() {
  const datosUsuario = obtenerDatosUsuario();
  const avatarInicial = AVATAR_POR_DEFECTO;

  // Guardar el avatar por defecto para evitar que reaparezca uno legacy
  guardarDatosUsuarioLocales(
    datosUsuario.username,
    datosUsuario.handle,
    avatarInicial,
  );

  // Actualizar preview de perfil
  const fotoPerfilPreview = document.getElementById("foto-perfil-preview");
  if (fotoPerfilPreview) {
    fotoPerfilPreview.src = avatarInicial;
  }

  // Actualizar foto en sidebar
  const avatarSidebar = document.querySelector(".mi-perfil .avatar img");
  if (avatarSidebar) {
    avatarSidebar.src = avatarInicial;
  }

  // Actualizar nombre y handle en sidebar
  const nombreSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil h3",
  );
  const handleSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil p",
  );

  if (nombreSidebar) {
    nombreSidebar.textContent = datosUsuario.username;
  }
  if (handleSidebar) {
    handleSidebar.textContent = datosUsuario.handle;
  }
}

// Event listeners para la Funciónonalidad de perfil
document.addEventListener("DOMContentLoaded", function () {
  // Cargar foto de perfil inicial
  cargarFotoPerfilInicial();

  // Configurar input de foto de perfil
  const inputFotoPerfil = document.getElementById("input-foto-perfil");
  if (inputFotoPerfil) {
    inputFotoPerfil.addEventListener("change", procesarNuevaFotoPerfil);
  }

  // Configurar botón de cambiar foto (buscar por el div clickeable)
  const contenedorCambiarFoto = document.querySelector(".cambiar-foto");
  if (contenedorCambiarFoto) {
    contenedorCambiarFoto.addEventListener("click", cambiarFotoPerfil);
    contenedorCambiarFoto.style.cursor = "pointer";
  }

  // También configurar clic en la imagen de perfil directamente
  const fotoPerfilPreview = document.getElementById("foto-perfil-preview");
  if (fotoPerfilPreview) {
    fotoPerfilPreview.addEventListener("click", cambiarFotoPerfil);
    fotoPerfilPreview.style.cursor = "pointer";
  }

  // Configurar botones de perfil
  const btnGuardarPerfil = document.querySelector(".btn-guardar-perfil");
  const btnCancelarPerfil = document.querySelector(".btn-cancelar-perfil");

  if (btnGuardarPerfil) {
    btnGuardarPerfil.addEventListener("click", guardarCambiosPerfil);
  }

  if (btnCancelarPerfil) {
    btnCancelarPerfil.addEventListener("click", cancelarCambiosPerfil);
  }

  // Cargar datos existentes en los inputs
  cargarDatosPerfilEnInputs();
});

// Función para cargar datos del perfil en los inputs
function cargarDatosPerfilEnInputs() {
  const datosUsuario = obtenerDatosUsuario();

  // Cargar datos en los inputs
  const inputUsername = document.getElementById("input-username");
  const inputHandle = document.getElementById("input-handle");
  const inputBio = document.getElementById("input-bio");

  if (inputUsername) {
    inputUsername.value = datosUsuario.username;
  }

  if (inputHandle) {
    inputHandle.value = datosUsuario.handle.replace("@", "");
  }

  // Cargar bio desde localStorage si existe
  try {
    const bioGuardada = localStorage.getItem("usuario_bio");
    if (inputBio && bioGuardada) {
      inputBio.value = bioGuardada;
    }
  } catch (error) {
    console.log("No se pudo cargar la bio guardada");
  }
}

// Función para guardar cambios del perfil
function guardarCambiosPerfil() {
  const inputUsername = document.getElementById("input-username");
  const inputHandle = document.getElementById("input-handle");
  const inputBio = document.getElementById("input-bio");

  // Validar datos
  const nuevoUsername = inputUsername.value.trim();
  const nuevoHandle = inputHandle.value.trim();
  const nuevaBio = inputBio.value.trim();

  if (!nuevoUsername) {
    mostrarAlertaError("Error", "El nombre de usuario no puede estar vacío");
    return;
  }

  if (!nuevoHandle) {
    mostrarAlertaError("Error", "El handle no puede estar vacío");
    return;
  }

  // Formatear handle
  const handleFormateado = nuevoHandle.startsWith("@")
    ? nuevoHandle
    : "@" + nuevoHandle;

  // Obtener avatar actual
  const datosActuales = obtenerDatosUsuario();

  // Guardar nuevos datos
  const exito = guardarDatosUsuarioLocales(
    nuevoUsername,
    handleFormateado,
    datosActuales.avatar,
  );

  if (exito) {
    // Guardar bio por separado
    try {
      localStorage.setItem("usuario_bio", nuevaBio);
    } catch (error) {
      console.error("Error al guardar bio:", error);
    }

    // Actualizar toda la interfaz
    actualizarInterfazConNuevosDatos(
      nuevoUsername,
      handleFormateado,
      datosActuales.avatar,
    );

    // Actualizar handle en el input
    inputHandle.value = handleFormateado.replace("@", "");

    // Los datos se sincronizarán automáticamente con el backend
    mostrarAlertaExito("¡éxito!", "Perfil actualizado correctamente");
  } else {
    mostrarAlertaError("Error", "No se pudieron guardar los cambios");
  }
}

// Función para cancelar cambios del perfil
function cancelarCambiosPerfil() {
  cargarDatosPerfilEnInputs(); // Recargar datos originales
  mostrarAlertaInfo("Cancelado", "Los cambios han sido descartados");
}

// Función para actualizar toda la interfaz con nuevos datos
function actualizarInterfazConNuevosDatos(username, handle, avatar) {
  // Actualizar sidebar
  const nombreSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil h3",
  );
  const handleSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil p",
  );

  if (nombreSidebar) {
    nombreSidebar.textContent = username;
  }
  if (handleSidebar) {
    handleSidebar.textContent = handle;
  }

  // Actualizar todas las publicaciones del usuario
  const publicacionesUsuario = document.querySelectorAll(".publicacion");
  publicacionesUsuario.forEach((publicacion) => {
    const autorElement = publicacion.querySelector(".usuario-datos h4");
    const handleElement = publicacion.querySelector(".usuario-handle");

    // Si es una publicación del usuario actual, actualizarla
    if (
      autorElement &&
      (autorElement.textContent === username ||
        autorElement.textContent === obtenerDatosUsuario().username)
    ) {
      autorElement.textContent = username;
      if (handleElement) {
        handleElement.textContent = handle;
      }
    }
  });

  // Actualizar comentarios del usuario
  actualizarComentariosUsuario(username, handle);
}

// Función para actualizar comentarios del usuario en memoria
function actualizarComentariosUsuario(nuevoUsername, nuevoHandle) {
  const datosAnteriores = obtenerDatosUsuario();

  // Actualizar comentarios en la variable global
  Object.keys(comentariosPorPublicacion).forEach((publicacionId) => {
    if (comentariosPorPublicacion[publicacionId]) {
      comentariosPorPublicacion[publicacionId].forEach((comentario) => {
        // Si el comentario es del usuario actual, actualizarlo
        if (
          comentario.autor === datosAnteriores.username ||
          comentario.handle === datosAnteriores.handle
        ) {
          comentario.autor = nuevoUsername;
          comentario.handle = nuevoHandle;
        }
      });
    }
  });

  // Recargar comentarios visibles en la interfaz
  const seccionesComentarios = document.querySelectorAll(
    '[id^="comentarios-"]',
  );
  seccionesComentarios.forEach((seccion) => {
    if (seccion.style.display !== "none") {
      const publicacionId = seccion.id.replace("comentarios-", "");
      cargarComentarios(publicacionId);
    }
  });
}

// ===========================================
// FunciónONES AUXILIARES PARA BACKEND
// ===========================================

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = "info") {
  // Crear contenedor de notificación si no existe
  let contenedorNotificaciones = document.getElementById(
    "contenedor-notificaciones",
  );
  if (!contenedorNotificaciones) {
    contenedorNotificaciones = document.createElement("div");
    contenedorNotificaciones.id = "contenedor-notificaciones";
    contenedorNotificaciones.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
    document.body.appendChild(contenedorNotificaciones);
  }

  // Crear notificación
  const notificacion = document.createElement("div");
  notificacion.style.cssText = `
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

  // Colores según el tipo
  switch (tipo) {
    case "success":
      notificacion.style.backgroundColor = "#10b981";
      break;
    case "error":
      notificacion.style.backgroundColor = "#ef4444";
      break;
    case "warning":
      notificacion.style.backgroundColor = "#f59e0b";
      break;
    default:
      notificacion.style.backgroundColor = "#3b82f6";
  }

  notificacion.textContent = mensaje;
  contenedorNotificaciones.appendChild(notificacion);

  // Animar entrada
  setTimeout(() => {
    notificacion.style.transform = "translateX(0)";
  }, 10);

  // Eliminar después de 3 segundos
  setTimeout(() => {
    notificacion.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Función para calcular tiempo transcurrido
function tiempoTranscurrido(fechaISO) {
  try {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = ahora - fecha;

    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (segundos < 60) return "ahora";
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;

    return fecha.toLocaleDateString();
  } catch (error) {
    console.warn("Error calculando tiempo transcurrido:", error);
    return "hace un momento";
  }
}

// Función para inicializar la conexión con el backend al cargar la página
async function inicializarBackend() {
  console.log(" Inicializando conexión con backend...");

  // Verificar si el backend está disponible
  const conectado = await verificarConexionBackend();

  if (conectado) {
    console.log(" Backend disponible, modo híbrido activado");

    // Cargar publicaciones del backend
    setTimeout(() => {
      cargarPublicaciones();
    }, 500);
  } else {
    console.log(" Backend no disponible, usando solo localStorage");
    usarBackend = false;

    // Cargar publicaciones de localStorage
    setTimeout(() => {
      cargarPublicaciones();
    }, 500);
  }
}
