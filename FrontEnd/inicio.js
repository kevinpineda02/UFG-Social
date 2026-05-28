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

const API_BASE_URL_HOME =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
    ? "http://18.118.211.33:8081"
    : "/api-backend";
const API_ENDPOINTS = {
  // Verificación de salud del backend
  health: `${API_BASE_URL_HOME}/health`,

  // Publicaciones (PublicationRestController)
  publication: `${API_BASE_URL_HOME}/publication`,

  // Foto de perfil
  profilePhoto: `${API_BASE_URL_HOME}/user`,

  // Usuario
  usuario: `${API_BASE_URL_HOME}/user`,
};

function getUserIdForApi() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  let userId = null;

  // Intentar obtener el ID de varias propiedades posibles
  if (user?.id) userId = user.id;
  else if (user?.userId) userId = user.userId;
  else if (user?.usuarioId) userId = user.usuarioId;
  else if (user?.idUser) userId = user.idUser;
  else userId = getStoredUserId();

  // Convertir a número si es string
  if (userId) {
    const numericId = Number(userId);
    if (!isNaN(numericId) && numericId > 0) {
      console.log(
        `👤 UserId obtenido: ${userId} (tipo: ${typeof userId}) → ${numericId} (número)`,
      );
      return numericId;
    }
  }

  console.error("❌ No se pudo obtener un userId válido:", {
    user,
    userId,
    storedId: getStoredUserId(),
  });
  return null;
}

function esAdminActual() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  const rol =
    user?.rol ||
    user?.role ||
    user?.credential?.rol ||
    user?.credential?.role ||
    localStorage.getItem("rol") ||
    localStorage.getItem("role") ||
    "";

  return String(rol).toUpperCase() === "ADMIN";
}

function puedeEliminarPublicacion(publication) {
  const userId = getUserIdForApi();
  const publicationOwnerId = Number(publication?.idUser || publication?.userId);

  const esDueno = Number(userId) === publicationOwnerId;
  const esAdmin = esAdminActual();

  return esDueno || esAdmin;
}

function puedeEliminarComentario(comentario, datosUsuario = null) {
  const userIdActual = getUserIdForApi();
  const commentUserId = extraerIdNumerico(
    comentario?.userId ??
      comentario?.idUser ??
      comentario?.usuarioId ??
      comentario?.idUsuario,
  );

  const esComentarioPropio =
    userIdActual && commentUserId
      ? Number(userIdActual) === Number(commentUserId)
      : false;

  const datos = datosUsuario || obtenerDatosUsuario();
  const esComentarioPropioPorHandle =
    !commentUserId &&
    typeof comentario?.handle === "string" &&
    typeof datos?.handle === "string" &&
    comentario.handle === datos.handle;

  return esComentarioPropio || esComentarioPropioPorHandle || esAdminActual();
}

async function esperarUsuarioAutenticado() {
  const usuarioActual =
    typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (usuarioActual || getStoredUserId()) {
    return usuarioActual;
  }

  return new Promise((resolve) => {
    const resolver = () => {
      const usuario =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (usuario || getStoredUserId()) {
        window.removeEventListener("gnet:user-loaded", resolver);
        window.removeEventListener("gnet:user-updated", resolver);
        clearTimeout(timer);
        resolve(usuario);
      }
    };

    const timer = setTimeout(() => {
      window.removeEventListener("gnet:user-loaded", resolver);
      window.removeEventListener("gnet:user-updated", resolver);
      resolve(typeof getCurrentUser === "function" ? getCurrentUser() : null);
    }, 1500);

    window.addEventListener("gnet:user-loaded", resolver);
    window.addEventListener("gnet:user-updated", resolver);
    resolver();
  });
}

// Estado de conexión con el backend
let backendConectado = false;
let usarBackend = true; // Cambiar a false para usar solo localStorage
let publicacionEnCurso = false;

const PERFIL_LOCAL_KEY = "gnet_perfil_usuario";
const PERFIL_SETUP_KEY = "gnet_perfil_setup_done";

function normalizarTexto(valor, valorDefecto = "") {
  return typeof valor === "string" && valor.trim()
    ? valor.trim()
    : valorDefecto;
}

function normalizarHandle(valor, nombreUsuario = "usuario") {
  const limpio = normalizarTexto(valor);
  if (limpio) {
    return limpio.startsWith("@") ? limpio : `@${limpio}`;
  }

  return `@${normalizarTexto(nombreUsuario, "usuario")
    .toLowerCase()
    .replace(/\s+/g, "")}`;
}

function normalizarContador(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

// ===========================================
// HELPERS PARA IDS Y NORMALIZACIÓN BACKEND
// ===========================================

function extraerIdNumerico(valor) {
  if (valor == null) return null;

  const texto = String(valor);

  const limpio = texto
    .replace("pub_", "")
    .replace("comment_backend_", "")
    .replace("comment_", "")
    .trim();

  const numero = Number(limpio);

  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function obtenerIdPublicacionReal(desde) {
  if (!desde) return null;

  if (typeof desde === "string") {
    const candidato = document.getElementById(desde);
    if (candidato) {
      return (
        extraerIdNumerico(candidato.dataset.publicationId) ||
        extraerIdNumerico(candidato.dataset.pubid) ||
        extraerIdNumerico(desde)
      );
    }

    return extraerIdNumerico(desde);
  }

  return (
    extraerIdNumerico(desde.dataset?.publicationId) ||
    extraerIdNumerico(desde.dataset?.pubid) ||
    extraerIdNumerico(desde.id)
  );
}

function obtenerClaveComentariosPublicacion(publicacionId) {
  const publicacion = obtenerPublicacionElemento(publicacionId);
  return String(
    publicacion?.dataset?.publicationId ||
      publicacion?.dataset?.pubid ||
      obtenerIdPublicacionReal(publicacionId) ||
      publicacionId,
  );
}

function esElementoVisible(elemento) {
  if (!elemento) return false;
  const estilos = window.getComputedStyle(elemento);
  if (estilos.display === "none" || estilos.visibility === "hidden") {
    return false;
  }
  return elemento.getClientRects().length > 0;
}

function obtenerPublicacionElemento(publicacionId, referencia = null) {
  if (referencia?.classList?.contains("publicacion")) {
    return referencia;
  }

  if (referencia && typeof referencia.closest === "function") {
    const publicacionCercana = referencia.closest(".publicacion");
    if (publicacionCercana) {
      return publicacionCercana;
    }
  }

  const idTexto = String(publicacionId || "");
  const candidatasId = Array.from(
    document.querySelectorAll(`.publicacion[id="${idTexto}"]`),
  );
  const realId = extraerIdNumerico(idTexto);
  const candidatasData = realId
    ? Array.from(
        document.querySelectorAll(
          `.publicacion[data-publication-id="${realId}"], .publicacion[data-pubid="${realId}"]`,
        ),
      )
    : [];

  const candidatas = [...new Set([...candidatasId, ...candidatasData])];
  if (candidatas.length === 0) {
    return null;
  }

  const visiblePerfil = candidatas.find((pub) => {
    const contenedorPerfil = pub.closest(".feed-mis-publicaciones");
    return (
      contenedorPerfil &&
      esElementoVisible(pub) &&
      esElementoVisible(contenedorPerfil)
    );
  });
  if (visiblePerfil) {
    return visiblePerfil;
  }

  const visible = candidatas.find((pub) => esElementoVisible(pub));
  return visible || candidatas[0];
}

function normalizarComentarioBackend(comentario) {
  if (!comentario) return null;

  const id = comentario.id ?? comentario.commentId ?? comentario.idComment;

  const userId =
    comentario.idUser ??
    comentario.userId ??
    comentario.usuarioId ??
    comentario.idUsuario;

  const username =
    comentario.username ??
    comentario.nombreUsuario ??
    comentario.user ??
    comentario.name ??
    "usuario";

  const nombre =
    comentario.user ??
    comentario.name ??
    comentario.nombre ??
    username ??
    "Usuario";

  const avatar =
    comentario.profilePhoto ??
    comentario.avatar ??
    comentario.fotoPerfil ??
    comentario.foto_perfil ??
    AVATAR_POR_DEFECTO;

  const texto =
    comentario.comment ??
    comentario.contenido ??
    comentario.comentario ??
    comentario.text ??
    "";

  const fecha =
    comentario.creationDate ??
    comentario.fechaCreacion ??
    comentario.createdAt ??
    comentario.fecha_creacion ??
    new Date().toISOString();

  return {
    id: `comment_backend_${id}`,
    backendId: id,
    userId: userId,
    username: username,
    nombre: nombre,
    handle: normalizarHandle(username, username),
    avatar: normalizarAvatar(avatar),
    contenido: texto,
    fechaCreacion: fecha,
    likes: comentario.likes ?? 0,
    liked: comentario.liked ?? false,
  };
}

function extraerContadorUsuario(usuario, claves) {
  if (!usuario) {
    return 0;
  }

  for (const clave of claves) {
    if (usuario[clave] != null) {
      return normalizarContador(usuario[clave]);
    }
  }

  return 0;
}

function obtenerPerfilLocal() {
  try {
    const perfil = localStorage.getItem(PERFIL_LOCAL_KEY);
    return perfil ? JSON.parse(perfil) : null;
  } catch (error) {
    console.warn("No se pudo leer el perfil local", error);
    return null;
  }
}

function guardarPerfilLocal(perfil) {
  try {
    localStorage.setItem(PERFIL_LOCAL_KEY, JSON.stringify(perfil));
    return true;
  } catch (error) {
    console.error("No se pudo guardar el perfil local", error);
    return false;
  }
}

async function actualizarPerfilBackend(nombre, username) {
  const userId = getUserIdForApi();

  if (!userId) {
    console.error("❌ No se pudo obtener userId para actualizar perfil");
    return null;
  }

  const body = {
    name: normalizarTexto(nombre, "Usuario"),
    username: normalizarTexto(username, "usuario")
      .replace(/^@/, "")
      .replace(/\s+/g, ""),
  };

  const response = await fetchConAutenticacion(
    `${API_ENDPOINTS.usuario}/${userId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    },
  );

  if (!response) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(`Error actualizando perfil: ${response.status}`, errorText);
    return null;
  }

  const perfilServidor = await response.json().catch(() => null);
  return perfilServidor && typeof perfilServidor === "object"
    ? perfilServidor
    : body;
}

function marcarPerfilInicialCompletado() {
  try {
    localStorage.setItem(PERFIL_SETUP_KEY, "1");
  } catch (error) {
    console.warn("No se pudo marcar el perfil como configurado", error);
  }
}

async function actualizarFotoPerfil(userId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/user/${userId}/profile-photo`,
    {
      method: "PATCH",
      headers: getAuthHeaders({}, true),
      body: formData,
    },
  );

  if (!response || !response.ok) {
    throw new Error("Error actualizando foto de perfil");
  }

  return await response.json();
}

function perfilInicialCompletado() {
  try {
    if (localStorage.getItem(PERFIL_SETUP_KEY) === "1") {
      return true;
    }

    const perfilLocal = obtenerPerfilLocal();
    return Boolean(
      perfilLocal &&
      perfilLocal.username &&
      perfilLocal.username !== "Invitado",
    );
  } catch (error) {
    return false;
  }
}

function actualizarContadoresPerfil(seguidores, seguidos) {
  const contadorSeguidores = document.querySelector(".contador-seguidores");
  const contadorSeguidos = document.querySelector(".contador-seguidos");

  if (contadorSeguidores) {
    contadorSeguidores.textContent = normalizarContador(seguidores);
  }

  if (contadorSeguidos) {
    contadorSeguidos.textContent = normalizarContador(seguidos);
  }
}

function guardarDatosUsuarioLocales(
  username,
  handle,
  avatar,
  seguidores = null,
  seguidos = null,
  bio = null,
) {
  const datosActuales = obtenerPerfilLocal() || {};
  const perfil = {
    username: normalizarTexto(username, datosActuales.username || "Usuario"),
    handle: normalizarHandle(handle, username || datosActuales.username),
    avatar: normalizarAvatar(avatar || datosActuales.avatar),
    seguidores:
      seguidores != null
        ? normalizarContador(seguidores)
        : normalizarContador(datosActuales.seguidores),
    seguidos:
      seguidos != null
        ? normalizarContador(seguidos)
        : normalizarContador(datosActuales.seguidos),
    bio:
      bio != null
        ? bio
        : typeof datosActuales.bio === "string"
          ? datosActuales.bio
          : "",
  };

  return guardarPerfilLocal(perfil);
}

function actualizarPerfilEnPantalla(datosUsuario) {
  if (!datosUsuario) {
    return;
  }

  const imagen = normalizarAvatar(datosUsuario.avatar);
  const username = normalizarTexto(
    datosUsuario.user ||
      datosUsuario.name ||
      datosUsuario.nombre ||
      datosUsuario.username,
    "Usuario",
  );
  const usernameHandle = normalizarTexto(
    datosUsuario.username || datosUsuario.handle?.replace("@", "") || username,
    username,
  );
  const handle = normalizarHandle(
    datosUsuario.handle || usernameHandle,
    usernameHandle,
  );
  const seguidores = normalizarContador(datosUsuario.seguidores);
  const seguidos = normalizarContador(datosUsuario.seguidos);

  const fotoPrincipal = document.getElementById("foto-perfil-preview");
  if (fotoPrincipal) {
    fotoPrincipal.src = imagen;
  }

  const avatarSidebar = document.querySelector(".mi-perfil .avatar img");
  if (avatarSidebar) {
    avatarSidebar.src = imagen;
  }

  const avatarHeader = document.querySelector(".usuario-header .avatar img");
  if (avatarHeader) {
    avatarHeader.src = imagen;
  }

  const nombreSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil h3",
  );
  if (nombreSidebar) {
    nombreSidebar.textContent = username;
  }

  const handleSidebar = document.querySelector(
    ".mi-perfil .nombre-usuario-perfil p",
  );
  if (handleSidebar) {
    handleSidebar.textContent = handle;
  }

  const nombreHeader = document.querySelector(
    ".usuario-header .nombre-usuario",
  );
  if (nombreHeader) {
    nombreHeader.textContent = username;
  }

  actualizarContadoresPerfil(seguidores, seguidos);
}

function prepararModalPerfilInicial(datosUsuario) {
  const overlay = document.getElementById("perfil-inicial-overlay");
  const inputAvatar = document.getElementById("perfil-inicial-avatar-url");
  const inputUsername = document.getElementById("perfil-inicial-username");
  const inputHandle = document.getElementById("perfil-inicial-handle");
  const previewAvatar = document.getElementById("perfil-inicial-preview");
  const textoSeguidores = document.getElementById("perfil-inicial-seguidores");
  const textoSeguidos = document.getElementById("perfil-inicial-seguidos");
  const btnGuardar = document.getElementById("perfil-inicial-guardar");

  if (
    !overlay ||
    !inputAvatar ||
    !inputUsername ||
    !inputHandle ||
    !previewAvatar
  ) {
    return;
  }

  inputAvatar.value = normalizarAvatar(datosUsuario.avatar);
  inputUsername.value = normalizarTexto(datosUsuario.username, "Usuario");
  inputHandle.value = normalizarHandle(
    datosUsuario.handle,
    inputUsername.value,
  );
  previewAvatar.src = normalizarAvatar(inputAvatar.value);

  if (textoSeguidores) {
    textoSeguidores.textContent = normalizarContador(datosUsuario.seguidores);
  }

  if (textoSeguidos) {
    textoSeguidos.textContent = normalizarContador(datosUsuario.seguidos);
  }

  inputAvatar.oninput = function () {
    previewAvatar.src = normalizarAvatar(inputAvatar.value);
  };

  if (btnGuardar) {
    btnGuardar.onclick = async function () {
      const nombre = inputUsername.value.trim();
      const handle = inputHandle.value.trim();
      const avatar = inputAvatar.value.trim();

      if (!nombre) {
        mostrarAlertaError("Error", "El nombre de usuario es obligatorio");
        return;
      }

      if (!avatar) {
        mostrarAlertaError(
          "Error",
          "Debes colocar la URL de una foto de perfil",
        );
        return;
      }

      const seguidores = normalizarContador(textoSeguidores?.textContent);
      const seguidos = normalizarContador(textoSeguidos?.textContent);

      const perfilServidor = await actualizarPerfilBackend(
        nombre,
        handle,
        avatar,
      );

      if (!perfilServidor) {
        mostrarAlertaError(
          "Error",
          "No se pudo actualizar el perfil en el servidor",
        );
        return;
      }

      const nombreGuardado = normalizarTexto(perfilServidor.name, nombre);
      const usernameGuardado = normalizarTexto(perfilServidor.username, handle);
      const avatarGuardado = normalizarAvatar(
        perfilServidor.profilePhoto || perfilServidor.avatar || avatar,
      );
      const perfilGuardado = {
        username: nombreGuardado,
        handle: normalizarHandle(usernameGuardado, nombreGuardado),
        avatar: avatarGuardado,
        seguidores,
        seguidos,
        bio: localStorage.getItem("usuario_bio") || "",
      };

      guardarPerfilLocal(perfilGuardado);
      marcarPerfilInicialCompletado();
      guardarDatosUsuarioLocales(
        perfilGuardado.username,
        perfilGuardado.handle,
        perfilGuardado.avatar,
        perfilGuardado.seguidores,
        perfilGuardado.seguidos,
        perfilGuardado.bio,
      );

      if (window.setCurrentUser) {
        const usuarioActual = getCurrentUser ? getCurrentUser() : null;
        window.setCurrentUser({
          ...(usuarioActual || {}),
          user: perfilGuardado.username,
          username: perfilGuardado.username,
          name: perfilGuardado.username,
          handle: perfilGuardado.handle,
          profileImage: perfilGuardado.avatar,
          profilePhoto: perfilGuardado.avatar,
          seguidores: perfilGuardado.seguidores,
          seguidos: perfilGuardado.seguidos,
        });
      }

      actualizarPerfilEnPantalla(perfilGuardado);
      overlay.classList.remove("active");
      document.body.classList.remove("modal-open");
      mostrarAlertaExito("¡Listo!", "Tu perfil quedó configurado");
    };
  }

  overlay.classList.add("active");
  document.body.classList.add("modal-open");
}

function inicializarPerfilDesdeBackend() {
  const datosUsuario = obtenerDatosUsuario();
  const perfilExistente = obtenerPerfilLocal();
  const yaTeniaPerfil = Boolean(
    perfilExistente &&
    perfilExistente.username &&
    perfilExistente.username !== "Invitado",
  );

  guardarDatosUsuarioLocales(
    datosUsuario.username,
    datosUsuario.handle,
    datosUsuario.avatar,
    datosUsuario.seguidores,
    datosUsuario.seguidos,
    datosUsuario.bio,
  );
  actualizarPerfilEnPantalla(datosUsuario);

  if (!yaTeniaPerfil && !perfilInicialCompletado()) {
    prepararModalPerfilInicial(datosUsuario);
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem("jwt");
  } catch (error) {
    return null;
  }
}

function getAuthHeaders(extraHeaders = {}, isFormData = false) {
  const token = typeof getStoredToken === "function" ? getStoredToken() : null;
  const fallbackToken =
    typeof getTokenFromStorageOrCookie === "function"
      ? getTokenFromStorageOrCookie()
      : null;
  const effectiveToken = token || fallbackToken;
  if (!effectiveToken) {
    console.warn(
      "⚠️ getAuthHeaders: No se encontró ningún token en localStorage/cookies",
    );
  } else {
    console.log(
      "🔑 Token encontrado:",
      effectiveToken.substring(0, 30) + "...",
    );
  }
  const headers = effectiveToken
    ? { ...extraHeaders, Authorization: `Bearer ${effectiveToken}` }
    : { ...extraHeaders };

  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  return headers;
}

function obtenerBotonPublicar() {
  return (
    document.querySelector(
      '.publicaciones .iconos .icono-btn[onclick="publicarContenido()"]',
    ) || document.querySelector(".publicaciones .iconos .icono-btn:last-of-type")
  );
}

function actualizarEstadoBotonPublicar(bloqueado) {
  const boton = obtenerBotonPublicar();

  if (!boton) {
    return;
  }

  boton.disabled = bloqueado;
  boton.setAttribute("aria-busy", bloqueado ? "true" : "false");
  boton.style.opacity = bloqueado ? "0.6" : "";
  boton.style.cursor = bloqueado ? "not-allowed" : "";
}

// ===========================================
// FunciónONES DE API BACKEND
// ===========================================

// Verificar conexión con el backend
async function verificarConexionBackend() {
  // Probar health primero, luego publication
  try {
    const response = await fetch(API_ENDPOINTS.health, {
      method: "GET",
    });

    if (response.ok) {
      backendConectado = true;
      console.log("✅ Backend conectado (health)");
      return true;
    }
  } catch (_) {}

  // Fallback: probar el endpoint de publicaciones
  try {
    const response = await fetch(API_ENDPOINTS.publication, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (response.ok || response.status === 200 || response.status === 401) {
      backendConectado = true;
      console.log("✅ Backend conectado (publication)");
      return true;
    }
  } catch (_) {}

  console.warn("⚠️ Backend no disponible");
  backendConectado = false;
  return false;
}

// Obtener todas las publicaciones del backend
// Función helper para manejar errores de autenticación en peticiones
async function fetchConAutenticacion(url, opciones = {}) {
  try {
    const opcionesFetch = { ...opciones };
    if (opcionesFetch.body instanceof FormData && opcionesFetch.headers) {
      const headers = { ...opcionesFetch.headers };
      delete headers["Content-Type"];
      delete headers["content-type"];
      opcionesFetch.headers = headers;
    }

    const response = await fetch(url, opcionesFetch);

    // Solo redirigir a login si es 401 (sin token válido)
    // 403 es permitido: token válido pero sin permisos
    if (response.status === 401) {
      console.warn("No autorizado (401). Redirigiendo a login...");
      if (window.logout) {
        window.logout();
      } else {
        window.location.replace("login.html");
      }
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error en la petición:", error);
    return null;
  }
}

function obtenerIdUsuarioActualParaFollow() {
  return getUserIdForApi();
}

function normalizarDatosUsuarioFollow(item = {}) {
  const id =
    item.id ??
    item.userId ??
    item.usuarioId ??
    item.requesterId ??
    item.receiverId ??
    item.followerId ??
    item.followedId ??
    null;

  const nombre = normalizarTexto(
    item.name ??
      item.fullName ??
      item.nombre ??
      item.requesterName ??
      item.receiverName ??
      item.username ??
      item.requesterUsername ??
      item.followedUsername ??
      item.followerUsername,
    "Usuario",
  );

  const handleBase = normalizarTexto(
    item.username ??
      item.handle ??
      item.requesterUsername ??
      item.receiverUsername ??
      item.followerUsername ??
      item.followedUsername,
    nombre,
  );

  return {
    id: id != null ? Number(id) : null,
    nombre,
    handle: normalizarHandle(handleBase, nombre),
    avatar: normalizarAvatar(
      item.profilePhoto ??
        item.avatar ??
        item.photo ??
        item.profileImage ??
        item.requesterProfilePhoto ??
        item.receiverProfilePhoto ??
        AVATAR_POR_DEFECTO,
    ),
    fecha: item.creationDate ?? item.createdAt ?? item.fechaCreacion ?? null,
    estado: item.status ?? item.estado ?? null,
    raw: item,
  };
}

function obtenerTextoEstadoFollow(estado) {
  if (!estado) return "";
  const texto = String(estado).toUpperCase();
  if (texto === "PENDIENTE") return "Pendiente";
  if (texto === "ACEPTADA" || texto === "ACEPTADO") return "Aceptada";
  if (texto === "RECHAZADA" || texto === "RECHAZADO") return "Rechazada";
  return texto.charAt(0) + texto.slice(1).toLowerCase();
}

function formatearFechaFollow(valorFecha) {
  if (!valorFecha) return "";

  const fecha = new Date(valorFecha);
  if (Number.isNaN(fecha.getTime())) return "";

  return fecha.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obtenerContenedorFollow(selector) {
  return document.querySelector(selector);
}

function renderizarEstadoFollow(contenedor, mensaje) {
  if (!contenedor) return;

  contenedor.innerHTML = `
    <h3>${contenedor.dataset?.titulo || "Seguimiento"}</h3>
    <div class="usuarios-perfil">
      <div class="perfil-usuarios follow-card follow-card--empty">
        <span>${mensaje}</span>
      </div>
    </div>
  `;
}

function crearTarjetaFollow({
  nombre,
  handle,
  avatar,
  meta = "",
  botones = "",
  requestId = null,
  userId = null,
}) {
  const dataRequestId =
    requestId != null ? ` data-request-id="${requestId}"` : "";
  const dataUserId = userId != null ? ` data-user-id="${userId}"` : "";

  return `
    <div class="usuarios-perfil">
      <div class="perfil-usuarios follow-card"${dataRequestId}${dataUserId}>
        <img src="${avatar}" alt="Avatar de ${nombre}">
        <div class="follow-datos">
          <span>${nombre}</span>
          <small>${handle}${meta ? ` · ${meta}` : ""}</small>
        </div>
        <div class="follow-acciones">
          ${botones}
        </div>
      </div>
    </div>
  `;
}

function normalizarRelacionFollow(item = {}) {
  return {
    id: item.id ?? null,
    followerId: item.followerId ?? null,
    followerName: item.followerName ?? item.name ?? item.username ?? "Usuario",
    followerUsername: item.followerUsername ?? item.username ?? "usuario",
    followerProfilePhoto:
      item.followerProfilePhoto ??
      item.profilePhoto ??
      item.avatar ??
      AVATAR_POR_DEFECTO,
    followedId: item.followedId ?? null,
    followedName: item.followedName ?? item.name ?? item.username ?? "Usuario",
    followedUsername: item.followedUsername ?? item.username ?? "usuario",
    followedProfilePhoto:
      item.followedProfilePhoto ??
      item.profilePhoto ??
      item.avatar ??
      AVATAR_POR_DEFECTO,
    raw: item,
  };
}

async function enviarSolicitudSeguimiento(requesterId, receiverId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/request/${requesterId}/${receiverId}`,
    {
      method: "POST",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    throw new Error(
      `Error enviando solicitud: ${response ? response.status : "sin respuesta"}`,
    );
  }

  return response.json();
}

async function obtenerSolicitudesPendientes(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/requests/pending/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return [];
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function aceptarSolicitudSeguimiento(requestId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/request/${requestId}/accept`,
    {
      method: "POST",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    throw new Error(
      `Error aceptando solicitud: ${response ? response.status : "sin respuesta"}`,
    );
  }

  return response.json();
}

async function rechazarSolicitudSeguimiento(requestId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/request/${requestId}/reject`,
    {
      method: "POST",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    throw new Error(
      `Error rechazando solicitud: ${response ? response.status : "sin respuesta"}`,
    );
  }

  return response.json();
}

async function obtenerSeguidores(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/followers/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return [];
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function obtenerSeguidos(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/following/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return [];
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function obtenerSolicitudesEnviadas(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/requests/sent/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return [];
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function solicitudYaEnviada(requesterId, receiverId) {
  const solicitudes = await obtenerSolicitudesEnviadas(requesterId);

  return solicitudes.some(
    (solicitud) =>
      Number(solicitud.receiverId) === Number(receiverId) &&
      String(solicitud.status).toUpperCase() === "PENDIENTE",
  );
}

async function cancelarSolicitudSeguimiento(requesterId, receiverId) {
  requesterId = Number(requesterId);
  receiverId = Number(receiverId);

  if (!requesterId || !receiverId) {
    console.error("IDs inválidos para cancelar solicitud:", {
      requesterId,
      receiverId,
    });
    return false;
  }

  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/request/${requesterId}/${receiverId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error(
      "Error cancelando solicitud:",
      response ? response.status : "sin respuesta",
      errorText,
    );
    return false;
  }

  return true;
}

function obtenerEstadoRelacion(targetUserId, seguidos, solicitudesEnviadas) {
  targetUserId = Number(targetUserId);

  const yaLoSigo = seguidos.some(
    (follow) => Number(follow.followedId) === targetUserId,
  );

  const solicitudPendiente = solicitudesEnviadas.some(
    (request) =>
      Number(request.receiverId) === targetUserId &&
      String(request.status).toUpperCase() === "PENDIENTE",
  );

  if (yaLoSigo) {
    return {
      texto: "Dejar de seguir",
      disabled: false,
      accion: "unfollow",
      clase: "dejar-de-seguir",
    };
  }

  if (solicitudPendiente) {
    return {
      texto: "Cancelar solicitud",
      disabled: false,
      accion: "cancel_request",
      clase: "seguir",
    };
  }

  return {
    texto: "Seguir",
    disabled: false,
    accion: "send_request",
    clase: "btn-seguir",
  };
}

function obtenerEstadoSugerencia(usuario, seguidos, solicitudesEnviadas) {
  return obtenerEstadoRelacion(usuario.id, seguidos, solicitudesEnviadas);
}

async function obtenerIdsUsuariosSeguidos(userId) {
  const seguidos = await obtenerSeguidos(userId);
  return seguidos
    .map((follow) => follow.followedId)
    .filter((id) => id != null)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function obtenerEstadoBotonSeguidor() {
  return {
    texto: "Eliminar",
    accion: "remove-follower",
    disabled: false,
    clase: "dejar-de-seguir",
  };
}

async function eliminarRelacionSeguimiento(followerId, followedId, accion = "seguimiento") {
  const currentUserId = getUserIdForApi();
  const followerIdNum = Number(followerId);
  const followedIdNum = Number(followedId);

  if (!currentUserId) {
    throw new Error("No se pudo identificar al usuario actual");
  }

  if (
    !Number.isFinite(followerIdNum) ||
    followerIdNum <= 0 ||
    !Number.isFinite(followedIdNum) ||
    followedIdNum <= 0
  ) {
    throw new Error("IDs inválidos para eliminar la relación de seguimiento");
  }

  const url = `${API_BASE_URL_HOME}/follow/${followerIdNum}/${followedIdNum}`;
  console.log("🗑️ DELETE follow:", {
    accion,
    url,
    followerId: followerIdNum,
    followedId: followedIdNum,
    currentUserId,
  });

  const response = await fetchConAutenticacion(url, {
    method: "DELETE",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });

  if (!response || !response.ok) {
    throw new Error(
      `Error eliminando relación de seguimiento: ${response ? response.status : "sin respuesta"}`,
    );
  }

  return true;
}

async function dejarDeSeguir(usuarioSeguidoId) {
  const currentUserId = getUserIdForApi();
  return eliminarRelacionSeguimiento(
    currentUserId,
    usuarioSeguidoId,
    "dejar-de-seguir",
  );
}

async function eliminarSeguidor(usuarioSeguidorId) {
  const currentUserId = getUserIdForApi();
  return eliminarRelacionSeguimiento(
    usuarioSeguidorId,
    currentUserId,
    "eliminar-seguidor",
  );
}

async function contarSeguidores(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/followers/${userId}/count`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return 0;
  }

  return obtenerNumeroDesdeRespuestaFollow(response);
}

async function contarSeguidos(userId) {
  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/follow/following/${userId}/count`,
    {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    return 0;
  }

  return obtenerNumeroDesdeRespuestaFollow(response);
}

async function obtenerNumeroDesdeRespuestaFollow(response) {
  const texto = await response.text().catch(() => "0");
  if (!texto) return 0;

  try {
    const posibleJson = JSON.parse(texto);
    if (typeof posibleJson === "number") return posibleJson;
    if (typeof posibleJson === "string") return normalizarContador(posibleJson);
    if (posibleJson && typeof posibleJson === "object") {
      return normalizarContador(
        posibleJson.count ??
          posibleJson.total ??
          posibleJson.value ??
          posibleJson.numero ??
          0,
      );
    }
  } catch (_) {
    return normalizarContador(texto);
  }

  return 0;
}

async function obtenerSugerenciasUsuarios(userId) {
  try {
    const response = await fetchConAutenticacion(
      `${API_BASE_URL_HOME}/user/suggestions/${userId}`,
      {
        method: "GET",
        headers: getAuthHeaders({ Accept: "application/json" }),
      },
    );

    if (!response || !response.ok) {
      console.error(
        "Error obteniendo sugerencias:",
        response ? response.status : "sin respuesta",
      );
      return [];
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo sugerencias de usuarios:", error);
    return [];
  }
}

async function enviarSolicitudDesdeSugerencia(receiverId, boton) {
  try {
    const requesterId = Number(getUserIdForApi());
    const suggestedId = Number(receiverId);

    if (!requesterId || !suggestedId) {
      console.error("IDs inválidos:", { requesterId, suggestedId });
      return;
    }

    if (requesterId === suggestedId) {
      console.warn("No puedes seguirte a ti mismo");
      return;
    }

    const idsSeguidos = await obtenerIdsUsuariosSeguidos(requesterId);
    if (idsSeguidos.includes(suggestedId)) {
      if (boton) {
        boton.textContent = "Siguiendo";
        boton.disabled = true;
        boton.classList.remove("btn-seguir");
        boton.classList.add("dejar-de-seguir");
      }
      console.warn("Ya sigues a este usuario");
      return;
    }

    const solicitudPendiente = await solicitudYaEnviada(
      requesterId,
      suggestedId,
    );

    if (solicitudPendiente) {
      if (boton) {
        boton.textContent = "Cancelar solicitud";
        boton.disabled = false;
        boton.classList.remove("btn-seguir");
        boton.classList.add("seguir");
        boton.dataset.accion = "cancel_request";
      }
      console.warn("Ya existe una solicitud pendiente");
      return;
    }

    const response = await fetchConAutenticacion(
      `${API_BASE_URL_HOME}/follow/request/${requesterId}/${suggestedId}`,
      {
        method: "POST",
        headers: getAuthHeaders({ Accept: "application/json" }),
      },
    );

    if (!response || !response.ok) {
      const errorText = response ? await response.text().catch(() => "") : "";
      console.error(
        "Error enviando solicitud:",
        response ? response.status : "sin respuesta",
        errorText,
      );
      return;
    }

    await response.json().catch(() => ({}));

    if (boton) {
      boton.textContent = "Cancelar solicitud";
      boton.disabled = false;
      boton.classList.remove("btn-seguir");
      boton.classList.add("seguir");
      boton.dataset.accion = "cancel_request";
    }
  } catch (error) {
    console.error("Error enviando solicitud de seguimiento:", error);
  }
}

async function cancelarSolicitudDesdeSugerencia(receiverId, boton) {
  try {
    const requesterId = Number(getUserIdForApi());
    const suggestedId = Number(receiverId);

    if (!requesterId || !suggestedId) {
      console.error("IDs inválidos:", { requesterId, suggestedId });
      return;
    }

    const ok = await cancelarSolicitudSeguimiento(requesterId, suggestedId);

    if (!ok) return;

    if (boton) {
      boton.textContent = "Seguir";
      boton.disabled = false;
      boton.classList.remove("solicitud-enviada");
      boton.classList.remove("seguir");
      boton.classList.add("btn-seguir");
      boton.dataset.accion = "send_request";
    }

    await recargarSistemaFollow();
  } catch (error) {
    console.error("Error cancelando solicitud de seguimiento:", error);
  }
}

async function cargarSugerenciasUsuarios() {
  const userId = getUserIdForApi();

  if (!userId) {
    console.error("No se pudo obtener el id del usuario logueado");
    return;
  }
  const [sugerencias, seguidos, solicitudesEnviadas] = await Promise.all([
    obtenerSugerenciasUsuarios(userId),
    obtenerSeguidos(userId),
    obtenerSolicitudesEnviadas(userId),
  ]);

  const contenedor = document.querySelector(".contenedor-sugerencias");

  if (!contenedor) {
    console.error("No se encontró el contenedor de sugerencias");
    return;
  }

  contenedor.innerHTML = "";

  const titulo = document.createElement("h3");
  titulo.className = "sugerencia-titulo";
  titulo.textContent = "Sugerencias para ti";
  contenedor.appendChild(titulo);

  // Construir mapa combinado: sugerencias (estado NONE) + solicitudes enviadas (estado PENDING_SENT)
  const mapa = new Map();

  (sugerencias || []).forEach((u) => {
    const id = Number(u.id);
    if (!id) return;
    mapa.set(id, {
      id,
      name: u.name || u.user || u.username || "Usuario",
      username: u.username || u.handle || "usuario",
      profilePhoto: u.profilePhoto || u.avatar || "./assets/Logo/UFGPerfil.jpg",
      estado: "NONE",
    });
  });

  (solicitudesEnviadas || []).forEach((s) => {
    const id = Number(s.receiverId ?? s.id ?? null);
    if (!id) return;
    // Las solicitudes enviadas tienen prioridad: si existe, marcamos como PENDING_SENT
    mapa.set(id, {
      id,
      name: s.receiverName || s.receiverUsername || s.name || "Usuario",
      username: s.receiverUsername || s.receiverName || s.username || "usuario",
      profilePhoto:
        s.receiverProfilePhoto ||
        s.receiverProfilePhoto ||
        "./assets/Logo/UFGPerfil.jpg",
      estado: "PENDING_SENT",
    });
  });

  const usuariosFinales = Array.from(mapa.values());

  if (usuariosFinales.length === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "No hay sugerencias disponibles.";
    contenedor.appendChild(vacio);
    return;
  }

  usuariosFinales.forEach((usuario) => {
    const idUsuario = Number(usuario.id);

    // Si ya lo sigues, mostramos la opción Dejar de seguir
    const yaLoSigo = (seguidos || []).some(
      (f) => Number(f.followedId) === idUsuario,
    );

    const item = document.createElement("div");
    item.className = "sugerencia-usuario";

    const avatar = normalizarAvatar(
      usuario.profilePhoto || "./assets/Logo/UFGPerfil.jpg",
    );
    const nombre = normalizarTexto(usuario.name, "Usuario");
    const username = normalizarTexto(usuario.username, "usuario");

    let textoBoton = "Seguir";
    let accion = "send_request";
    let clase = "btn-seguir";
    let disabled = false;

    if (yaLoSigo) {
      textoBoton = "Dejar de seguir";
      accion = "unfollow";
      clase = "dejar-de-seguir";
    } else if (usuario.estado === "PENDING_SENT") {
      textoBoton = "Cancelar solicitud";
      accion = "cancel_request";
      clase = "seguir";
    }

    item.innerHTML = `
      <img
        src="${avatar}"
        alt="${username || "usuario"}"
        class="avatar-sugerencia"
      >

      <div class="datos-sugerencia">
        <strong>${nombre}</strong>
        <span>@${username}</span>
      </div>

      <button
        class="${clase}"
        ${disabled ? "disabled" : ""}
        data-accion="${accion}"
        data-user-id="${idUsuario}"
      >
        ${textoBoton}
      </button>
    `;

    const boton = item.querySelector("button[data-accion]");
    if (boton) {
      boton.addEventListener("click", async () => {
        const accionActual = boton.dataset.accion;
        const targetId = Number(boton.dataset.userId || usuario.id);

        if (accionActual === "send_request") {
          await enviarSolicitudDesdeSugerencia(targetId, boton);
          return;
        }

        if (accionActual === "cancel_request") {
          await cancelarSolicitudDesdeSugerencia(targetId, boton);
          return;
        }

        if (accionActual === "unfollow") {
          const userIdActual = getUserIdForApi();
          if (!userIdActual) return;
          try {
            await dejarDeSeguir(targetId);
            await recargarSistemaFollow();
          } catch (e) {
            console.error("Error al dejar de seguir:", e);
          }
        }
      });
    }

    contenedor.appendChild(item);
  });
}

function actualizarBotonSolicitudEnviada(boton) {
  if (!boton) return;

  boton.textContent = "Solicitud enviada";
  boton.disabled = true;
  boton.style.opacity = "0.7";
  boton.style.cursor = "not-allowed";
}

async function renderizarPanelSolicitudesPendientes() {
  const contenedor = obtenerContenedorFollow(".solicitudes");
  if (!contenedor) return;

  const userId = obtenerIdUsuarioActualParaFollow();
  if (!userId) {
    renderizarEstadoFollow(
      contenedor,
      "Inicia sesión para ver tus solicitudes.",
    );
    return;
  }

  contenedor.dataset.titulo = "Solicitudes de amistad";
  const solicitudes = await obtenerSolicitudesPendientes(userId);

  contenedor.innerHTML = `
    <h3 class="sugerencia-titulo">Solicitudes de amistad</h3>
    ${solicitudes
      .map((solicitud) => {
        const usuario = normalizarDatosUsuarioFollow(solicitud);
        const fecha = formatearFechaFollow(usuario.fecha);
        return crearTarjetaFollow({
          nombre: usuario.nombre,
          handle: usuario.handle,
          avatar: usuario.avatar,
          meta: `${obtenerTextoEstadoFollow(usuario.estado)}${fecha ? ` · ${fecha}` : ""}`,
          requestId: solicitud.id,
          userId: usuario.id ?? solicitud.requesterId ?? null,
          botones: `
            <button class="aceptar" data-follow-action="accept-request" data-request-id="${solicitud.id}">Aceptar</button>
            <button class="rechazar" data-follow-action="reject-request" data-request-id="${solicitud.id}">Rechazar</button>
          `,
        });
      })
      .join("")}
  `;
}

async function renderizarPanelSeguidores() {
  const contenedor = obtenerContenedorFollow(".seguidores-contenedor");
  if (!contenedor) return;

  const userId = obtenerIdUsuarioActualParaFollow();
  if (!userId) {
    renderizarEstadoFollow(
      contenedor,
      "Inicia sesión para ver tus seguidores.",
    );
    return;
  }

  contenedor.dataset.titulo = "Seguidores";
  const seguidores = await obtenerSeguidores(userId);

  if (!seguidores.length) {
    renderizarEstadoFollow(contenedor, "Aún no tienes seguidores.");
    return;
  }

  contenedor.innerHTML = `
    <h3>Seguidores</h3>
    ${seguidores
      .map((item) => {
        const follow = normalizarRelacionFollow(item);
        const estadoBoton = obtenerEstadoBotonSeguidor(follow);
        return crearTarjetaFollow({
          nombre: follow.followerName,
          handle: normalizarHandle(
            follow.followerUsername,
            follow.followerName,
          ),
          avatar: follow.followerProfilePhoto,
          userId: follow.followerId,
          botones: `
            <button class="${estadoBoton.clase}" data-follow-action="${estadoBoton.accion}" data-user-id="${follow.followerId ?? ""}" data-follower-id="${follow.followerId ?? ""}" data-followed-id="${userId}" ${estadoBoton.disabled ? "disabled" : ""}>${estadoBoton.texto}</button>
          `,
        });
      })
      .join("")}
  `;
}

async function renderizarPanelSeguidos() {
  const contenedor = obtenerContenedorFollow(".seguidos");
  if (!contenedor) return;

  const userId = obtenerIdUsuarioActualParaFollow();
  if (!userId) {
    renderizarEstadoFollow(
      contenedor,
      "Inicia sesión para ver a quién sigues.",
    );
    return;
  }

  contenedor.dataset.titulo = "Seguidos";
  const seguidos = await obtenerSeguidos(userId);

  if (!seguidos.length) {
    renderizarEstadoFollow(contenedor, "Todavía no sigues a nadie.");
    return;
  }

  contenedor.innerHTML = `
    <h3>Seguidos</h3>
    ${seguidos
      .map((item) => {
        const follow = normalizarRelacionFollow(item);
        return crearTarjetaFollow({
          nombre: follow.followedName,
          handle: normalizarHandle(
            follow.followedUsername,
            follow.followedName,
          ),
          avatar: follow.followedProfilePhoto,
          userId: follow.followedId,
          botones: `
            <button class="dejar-de-seguir" data-follow-action="unfollow-followed" data-followed-id="${follow.followedId ?? ""}" data-follower-id="${follow.followerId ?? ""}">Dejar de seguir</button>
          `,
        });
      })
      .join("")}
  `;
}

async function actualizarContadoresFollowPanel() {
  const userId = obtenerIdUsuarioActualParaFollow();
  if (!userId) return;

  const [seguidores, seguidos] = await Promise.all([
    contarSeguidores(userId),
    contarSeguidos(userId),
  ]);

  actualizarContadoresPerfil(seguidores, seguidos);
}

async function recargarSistemaFollow() {
  await Promise.all([
    renderizarPanelSolicitudesPendientes(),
    renderizarPanelSeguidores(),
    renderizarPanelSeguidos(),
    actualizarContadoresFollowPanel(),
  ]);
}

async function obtenerPublicacionesBackend() {
  try {
    const response = await fetchConAutenticacion(API_ENDPOINTS.publication, {
      headers: getAuthHeaders(),
    });

    if (!response) return [];
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo publicaciones del backend:", error);
    return [];
  }
}

async function obtenerPublicacionesPorUsuario(userId) {
  try {
    const response = await fetchConAutenticacion(
      `${API_ENDPOINTS.publication}/user/${userId}`,
      { headers: getAuthHeaders() },
    );
    if (!response) return [];
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo publicaciones del usuario:", error);
    return [];
  }
}

async function obtenerMisPublicaciones() {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("No se pudo obtener el ID del usuario logueado");
      return [];
    }

    const response = await fetchConAutenticacion(
      `${API_ENDPOINTS.publication}/user/${userId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response) return [];

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "Error obteniendo publicaciones del perfil:",
        response.status,
        errorText,
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo mis publicaciones:", error);
    return [];
  }
}

function obtenerContenedorMisPublicaciones() {
  let contenedor = document.querySelector(".contenido .feed-mis-publicaciones");
  const contenido = document.querySelector(".contenido");
  const feedPublicaciones = document.querySelector(".feed-publicaciones");

  if (!contenedor && contenido) {
    contenedor = document.createElement("div");
    contenedor.className = "feed-mis-publicaciones";
    contenedor.style.display = "none";

    if (feedPublicaciones && feedPublicaciones.parentNode === contenido) {
      feedPublicaciones.insertAdjacentElement("afterend", contenedor);
    } else {
      contenido.appendChild(contenedor);
    }
  }

  return contenedor;
}

function construirMediaItemsPublicacion(publicacionData = {}) {
  const mediaItems = [];
  let images = Array.isArray(publicacionData.images)
    ? publicacionData.images.slice()
    : [];

  if (images.length > 0 && typeof images[0] === "string") {
    images = images.map((url, index) => ({
      imageUrl: url,
      orderImage: index,
    }));
  }

  images
    .filter(
      (img) => typeof img?.imageUrl === "string" && img.imageUrl.trim() !== "",
    )
    .sort((a, b) => (a.orderImage || 0) - (b.orderImage || 0))
    .forEach((img) => {
      mediaItems.push({
        type: "image",
        url: img.imageUrl,
      });
    });

  const videoUrl =
    typeof publicacionData.videoUrl === "string"
      ? publicacionData.videoUrl.trim()
      : "";

  if (videoUrl) {
    mediaItems.push({
      type: "video",
      url: videoUrl,
    });
  }

  return mediaItems;
}

function construirCarruselMedia(publicacionData, pubId) {
  const mediaItems = construirMediaItemsPublicacion(publicacionData);

  if (mediaItems.length === 0) {
    return {
      htmlMedia: "",
      totalSlides: 0,
    };
  }

  const slidesHtml = mediaItems
    .map((item, index) => {
      if (item.type === "video") {
        return `
      <div class="imagen-slide ${index === 0 ? "active" : ""} tiene-video">
        <video controls preload="metadata">
          <source src="${item.url}">
          Tu navegador no soporta el elemento video.
        </video>
      </div>
    `;
      }

      return `
      <div class="imagen-slide ${index === 0 ? "active" : ""}">
        <img src="${item.url}" alt="Imagen de la publicación">
        <button class="btn-expandir" onclick="expandirImagen('${item.url}', 'Imagen de la publicación')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>
    `;
    })
    .join("");

  const indicatorsHtml = mediaItems
    .map(
      (_, index) => `
      <div class="indicador ${index === 0 ? "active" : ""}" onclick="irSlidePublicacion('${pubId}', ${index}, this)"></div>
    `,
    )
    .join("");

  const htmlMedia = `
      <div class="carrusel-imagenes">
        <div class="carrusel-contenedor">
          ${slidesHtml}
        </div>
        ${
          mediaItems.length > 1
            ? `
        <button class="btn-anterior" onclick="cambiarSlidePublicacion('${pubId}', -1, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button class="btn-siguiente" onclick="cambiarSlidePublicacion('${pubId}', 1, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <div class="indicadores">${indicatorsHtml}</div>
        `
            : ""
        }
        <div class="contador-imagenes">
          <span class="imagen-actual">1</span>/<span class="total-imagenes">${mediaItems.length}</span>
        </div>
      </div>`;

  return {
    htmlMedia,
    totalSlides: mediaItems.length,
  };
}

function construirHTMLPublicacionBackend(publicacionData, opciones = {}) {
  const pubId = `pub_${publicacionData.id}`;
  const publicationIdBackend = Number(publicacionData.id);
  const autor = publicacionData.user || "Usuario";
  const username = publicacionData.username || "usuario";
  const avatar = publicacionData.profilePhoto || "./assets/Logo/UFGPerfil.jpg";
  const handle = `@${username}`;
  const description = publicacionData.description || "";
  const likes = publicacionData.likes || 0;
  const coments = publicacionData.coments || 0;
  const timestamp = publicacionData.creationDate
    ? new Date(publicacionData.creationDate).getTime()
    : Date.now();
  const { htmlMedia } = construirCarruselMedia(publicacionData, pubId);

  const esDelUsuarioActual =
    opciones.forzarMenuEdicion || puedeEliminarPublicacion(publicacionData);

  const menuOpciones = esDelUsuarioActual
    ? `
    <div class="menu-opciones">
      <button class="btn-menu-publicacion" onclick="toggleMenuPublicacion('${pubId}')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      <div class="menu-dropdown-publicacion" id="menu-pub-${pubId}">
        <button class="menu-opcion eliminar" onclick="${opciones.modoPerfil ? `eliminarPublicacionPerfil(${publicationIdBackend}, '${pubId}')` : `eliminarPublicacion(${publicationIdBackend}, this)`}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar publicación
        </button>
      </div>
    </div>
  `
    : "";

  return `
    <div class="publicacion" id="${pubId}" data-timestamp="${timestamp}" data-publication-id="${publicacionData.id}" data-pubid="${publicacionData.id}">
      <div class="usuario-info">
        <div class="avatar">
          <img src="${avatar}" alt="${autor}">
        </div>
        <div class="usuario-datos">
          <h4>${autor}</h4>
          <p class="usuario-handle">${handle}</p>
          <p class="tiempo-publicacion">${tiempoTranscurrido(publicacionData.creationDate)}</p>
        </div>
        ${menuOpciones}
      </div>
      <div class="contenido-publicacion">
        ${description ? `<p>${description}</p>` : ""}
        ${htmlMedia}
      </div>
      <div class="separador"></div>
      <div class="acciones-publicacion">
        <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, ${publicationIdBackend})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span>${likes}</span>
        </button>
        <button class="accion-btn comentarios" onclick="alternarComentarios(${publicationIdBackend}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          <span>${coments}</span>
        </button>
      </div>
      ${generarHTMLComentarios(pubId)}
    </div>`;
}

function renderizarPublicacionMiPerfil(publication) {
  return `<div class="contenedor-publicacion">
    ${construirHTMLPublicacionBackend(publication, {
      forzarMenuEdicion: true,
      modoPerfil: true,
    })}
  </div>`;
}

async function cargarPublicacionesMiPerfil() {
  const userId = getUserIdForApi();

  if (!userId) {
    console.error("No se pudo obtener userId");
    return;
  }

  const contenedor = obtenerContenedorMisPublicaciones();

  if (!contenedor) {
    console.error("No existe el contenedor de publicaciones de perfil");
    return;
  }

  contenedor.innerHTML = "";

  const response = await fetchConAutenticacion(
    `${API_ENDPOINTS.publication}/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error(
      "Error cargando publicaciones de Mi Perfil:",
      response ? response.status : "sin respuesta",
      errorText,
    );
    contenedor.innerHTML = "<p>No se pudieron cargar tus publicaciones.</p>";
    return;
  }

  const publicaciones = await response.json();

  if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
    contenedor.innerHTML = "<p></p>";
    return;
  }

  publicaciones.sort((a, b) => {
    const fechaA = new Date(a.creationDate || 0).getTime();
    const fechaB = new Date(b.creationDate || 0).getTime();
    return fechaB - fechaA;
  });

  contenedor.innerHTML = publicaciones
    .map((publication) => renderizarPublicacionMiPerfil(publication))
    .join("");

  contenedor.querySelectorAll(".contenedor-publicacion").forEach((nodo) => {
    if (typeof reinicializarEventosPublicacion === "function") {
      reinicializarEventosPublicacion(nodo);
    }

    const pubElement = nodo.querySelector(".publicacion");

    if (pubElement && pubElement.id) {
      const publicationIdBackend = Number(
        pubElement.dataset.publicationId || pubElement.dataset.pubid,
      );

      const botonComentarios = pubElement.querySelector(
        ".accion-btn.comentarios",
      );
      if (botonComentarios) {
        botonComentarios.onclick = () =>
          alternarComentarios(
            Number.isInteger(publicationIdBackend) && publicationIdBackend > 0
              ? publicationIdBackend
              : pubElement.id,
            pubElement,
          );
      }

      const botonMenu = pubElement.querySelector(".btn-menu-publicacion");
      if (botonMenu) {
        botonMenu.onclick = () =>
          toggleMenuPublicacion(pubElement.id, pubElement);
      }

      const botonEliminar = pubElement.querySelector(
        ".menu-dropdown-publicacion .menu-opcion.eliminar",
      );
      if (botonEliminar) {
        botonEliminar.onclick = () =>
          eliminarPublicacionPerfil(
            Number.isInteger(publicationIdBackend) && publicationIdBackend > 0
              ? publicationIdBackend
              : pubElement.dataset.publicationId || pubElement.dataset.pubid,
            pubElement.id,
            pubElement,
          );
      }

      if (typeof inicializarLikePublicacion === "function") {
        inicializarLikePublicacion(
          Number.isInteger(publicationIdBackend) && publicationIdBackend > 0
            ? publicationIdBackend
            : pubElement.id,
          pubElement,
        );
      }

      if (typeof actualizarContadorComentarios === "function") {
        actualizarContadorComentarios(
          Number.isInteger(publicationIdBackend) && publicationIdBackend > 0
            ? publicationIdBackend
            : pubElement.id,
          pubElement,
        );
      }
    }
  });
}

async function crearPublicacion(
  userId,
  description,
  imageFiles = [],
  videoFile = null,
) {
  const formData = new FormData();
  formData.append("description", description);

  if (imageFiles && imageFiles.length > 0) {
    Array.from(imageFiles).forEach((file) => {
      formData.append("files", file);
    });
  }

  if (videoFile) {
    formData.append("videoFile", videoFile);
  }

  const response = await fetchConAutenticacion(
    `${API_BASE_URL_HOME}/publication/${userId}`,
    {
      method: "POST",
      headers: getAuthHeaders({}, true),
      body: formData,
    },
  );

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    throw new Error(errorText || "Error creando publicación");
  }

  return await response.json();
}

// Crear publicación en el backend (PublicationRestController)
async function crearPublicacionBackend(contenido, archivosSeleccionados = []) {
  try {
    const currentUser =
      typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const userId =
      currentUser?.id ||
      currentUser?.userId ||
      currentUser?.usuarioId ||
      currentUser?.idUser ||
      getStoredUserId();
    const idUserNum = parseInt(userId);
    const userIdResolvido =
      !isNaN(idUserNum) && idUserNum > 0 ? idUserNum : userId;

    if (!userIdResolvido) {
      console.error("❌ No se pudo obtener userId para crear publicación");
      return null;
    }

    const { imageFiles, videoFiles, invalidFiles } = obtenerArchivosPublicacion(
      archivosSeleccionados,
    );

    if (invalidFiles.length > 0) {
      console.error("❌ Se detectaron archivos multimedia no válidos");
      return null;
    }

    const mensajeValidacion = validarArchivosPublicacion(
      imageFiles,
      videoFiles,
    );
    if (mensajeValidacion) {
      console.error(`❌ ${mensajeValidacion}`);
      return null;
    }

    return await crearPublicacion(
      userIdResolvido,
      contenido,
      imageFiles,
      videoFiles[0] || null,
    );
  } catch (error) {
    console.error("Error creando publicación en backend:", error);
    return null;
  }
}

async function crearPublicacionConImagenes(
  userId,
  description,
  imageFiles = [],
  videoFile = null,
) {
  return crearPublicacion(userId, description, imageFiles, videoFile);
}

// ===========================================
// LIKES DE PUBLICACIONES
// ===========================================

// Dar like a una publicación
// POST /publication/{publicationId}/like/{userId}
async function darLikeBackend(publicacionId) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener userId para dar like");
      return null;
    }

    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error("❌ publicationId inválido para dar like:", publicacionId);
      return null;
    }

    const url = `${API_ENDPOINTS.publication}/${id}/like/${userId}`;

    console.log(
      `📤 POST Like - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}, UserId: ${userId}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Error dando like:", response.status, errorText);
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error dando like en backend:", error);
    return null;
  }
}

// Quitar like de una publicación
// DELETE /publication/{publicationId}/like/{userId}
async function quitarLikeBackend(publicacionId) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener userId para quitar like");
      return null;
    }

    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error(
        "❌ publicationId inválido para quitar like:",
        publicacionId,
      );
      return null;
    }

    const url = `${API_ENDPOINTS.publication}/${id}/like/${userId}`;

    console.log(
      `📥 DELETE Like - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}, UserId: ${userId}`,
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Error quitando like:", response.status, errorText);
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error quitando like en backend:", error);
    return null;
  }
}

// Verificar si el usuario ya dio like
// GET /publication/{publicationId}/like/{userId}
async function verificarLikeBackend(publicacionId) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener userId para verificar like");
      return false;
    }

    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error(
        "❌ publicationId inválido para verificar like:",
        publicacionId,
      );
      return false;
    }

    const url = `${API_ENDPOINTS.publication}/${id}/like/${userId}`;

    console.log(
      `🔍 GET Like - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}, UserId: ${userId}`,
    );

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data === true || data === "true";
  } catch (error) {
    console.error("Error verificando like en backend:", error);
    return false;
  }
}

// Contar likes de una publicación
// GET /publication/{publicationId}/likes/count
async function obtenerCantidadLikesBackend(publicacionId) {
  try {
    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error(
        "❌ publicationId inválido para contar likes:",
        publicacionId,
      );
      return 0;
    }

    const url = `${API_ENDPOINTS.publication}/${id}/likes/count`;

    console.log(
      `📊 GET Count - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}`,
    );

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();

    return typeof data === "number" ? data : parseInt(data) || 0;
  } catch (error) {
    console.error("Error obteniendo cantidad de likes:", error);
    return 0;
  }
}

// ===========================================
// COMENTARIOS DE PUBLICACIONES
// ===========================================

// Agregar comentario
// POST /publication/{publicationId}/comments/{userId}
async function agregarComentarioBackend(publicacionId, textoComentario) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener userId para comentar");
      return null;
    }

    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error("❌ publicationId inválido para comentar:", publicacionId);
      return null;
    }

    const url = `${API_ENDPOINTS.publication}/${id}/comments/${userId}`;

    console.log(
      `💬 POST Comentario - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}, UserId: ${userId}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        comment: textoComentario,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Error agregando comentario:", response.status, errorText);
      return null;
    }

    const data = await response.json();

    return normalizarComentarioBackend(data);
  } catch (error) {
    console.error("Error agregando comentario en backend:", error);
    return null;
  }
}

// Obtener comentarios de una publicación
// GET /publication/{publicationId}/comments
async function obtenerComentariosBackend(publicacionId) {
  try {
    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error(
        "❌ publicationId inválido para obtener comentarios:",
        publicacionId,
      );
      return [];
    }

    const url = `${API_BASE_URL_HOME}/publication/${id}/comments`;

    console.log(
      `📥 GET Comentarios - URL: ${url}, PublicacionId: ${publicacionId}, RealId: ${id}`,
    );

    const response = await fetchConAutenticacion(url, {
      method: "GET",
      headers: getAuthHeaders({ Accept: "application/json" }),
    });

    if (!response || !response.ok) {
      const errorText = response ? await response.text().catch(() => "") : "";
      console.error(
        "Error obteniendo comentarios:",
        response ? response.status : "sin respuesta",
        errorText,
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo comentarios del backend:", error);
    return [];
  }
}

async function obtenerComentariosPublicacion(publicationId) {
  try {
    const id = Number(publicationId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error(
        "❌ publicationId inválido para obtener comentarios:",
        publicationId,
      );
      return [];
    }

    const response = await fetch(
      `${API_ENDPOINTS.publication}/${id}/comments`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "Error obteniendo comentarios:",
        response.status,
        errorText,
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data)
      ? data
          .map(normalizarComentarioBackend)
          .filter((comentario) => comentario !== null)
      : [];
  } catch (error) {
    console.error("Error obteniendo comentarios:", error);
    return [];
  }
}

// Eliminar comentario
// DELETE /publication/comments/{commentId}/user/{userId}
async function eliminarComentarioBackend(commentId) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener el ID del usuario");
      return false;
    }

    const realCommentId = extraerIdNumerico(commentId);

    if (!realCommentId) {
      console.error("❌ commentId inválido para eliminar:", commentId);
      return false;
    }

    const url = `${API_ENDPOINTS.publication}/comments/${realCommentId}/user/${userId}`;

    console.log(
      `🗑️ DELETE Comentario - URL: ${url}, CommentId: ${commentId}, RealId: ${realCommentId}, UserId: ${userId}`,
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Error eliminando comentario:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error eliminando comentario en backend:", error);
    return false;
  }
}

// Eliminar publicación (DELETE /publication/{publicacionId}/user/{userId})
async function eliminarPublicacionBackend(publicacionId) {
  try {
    const userId = getUserIdForApi();

    if (!userId) {
      console.error("❌ No se pudo obtener userId para eliminar publicación");
      return false;
    }

    const id = Number(publicacionId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error("❌ publicationId inválido:", publicacionId);
      return false;
    }

    const response = await fetch(
      `${API_ENDPOINTS.publication}/${id}/user/${userId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "Error eliminando publicación:",
        response.status,
        errorText,
      );
      return false;
    }

    return true;
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
  if (!fecha) return "ahora";

  const fechaPublicacion = new Date(fecha);
  const ahora = new Date();

  const diferenciaMs = ahora - fechaPublicacion;
  const segundos = Math.floor(diferenciaMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  if (horas < 24) return `hace ${horas} h`;
  if (dias < 7) return `hace ${dias} d`;

  return fechaPublicacion.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

  // Base64 es VÁLIDO, dejar que se muestre
  if (esRutaLegacy) {
    return AVATAR_POR_DEFECTO;
  }

  // Si es base64 o URL válida, retornar tal cual
  if (
    avatarNormalizado.startsWith("data:image/") ||
    avatarNormalizado.startsWith("http")
  ) {
    return avatarNormalizado;
  }

  return avatarNormalizado;
}

// Función para obtener datos del usuario desde el backend (currentUser)
function obtenerDatosUsuario() {
  const perfilLocal = obtenerPerfilLocal();

  // Obtener usuario del sistema de autenticación (auth.js)
  const usuario = getCurrentUser && getCurrentUser();

  const usernameBase = normalizarTexto(
    perfilLocal?.username ||
      usuario?.user ||
      usuario?.name ||
      usuario?.username,
    "Usuario",
  );
  const handleBase = normalizarHandle(
    perfilLocal?.handle || usuario?.handle || usuario?.username,
    usuario?.username || usernameBase,
  );
  const avatarBase = normalizarTexto(
    perfilLocal?.avatar || usuario?.profileImage,
    AVATAR_POR_DEFECTO,
  );
  const seguidoresBase =
    perfilLocal?.seguidores ??
    extraerContadorUsuario(usuario, [
      "seguidores",
      "followers",
      "followersCount",
      "contadorSeguidores",
    ]);
  const seguidosBase =
    perfilLocal?.seguidos ??
    extraerContadorUsuario(usuario, [
      "seguidos",
      "following",
      "followingCount",
      "contadorSeguidos",
    ]);

  // Si hay usuario autenticado, usarlo
  if (usuario) {
    const nombreVisible = normalizarTexto(
      usuario.user || usuario.name || usuario.nombre || usuario.username,
      "Usuario",
    );
    const usernameHandle = normalizarTexto(
      usuario.username || usuario.handle?.replace("@", "") || nombreVisible,
      nombreVisible,
    );

    return {
      username: nombreVisible,
      name: nombreVisible,
      user: nombreVisible,
      handle: normalizarHandle(
        usuario.handle || usernameHandle,
        usernameHandle,
      ),
      avatar:
        usuario.profileImage ||
        usuario.profilePhoto ||
        usuario.avatar ||
        AVATAR_POR_DEFECTO,
      seguidores: extraerContadorUsuario(usuario, [
        "seguidores",
        "followers",
        "followersCount",
        "contadorSeguidores",
      ]),
      seguidos: extraerContadorUsuario(usuario, [
        "seguidos",
        "following",
        "followingCount",
        "contadorSeguidos",
      ]),
      bio: usuario.bio || usuario.description || "",
    };
  }

  // Si no hay usuario logueado, usar valores predeterminados
  console.warn("⚠️ No hay usuario autenticado");
  return {
    username: perfilLocal?.username || "Invitado",
    handle: perfilLocal?.handle || "@invitado",
    avatar: perfilLocal?.avatar || AVATAR_POR_DEFECTO,
    seguidores: normalizarContador(perfilLocal?.seguidores),
    seguidos: normalizarContador(perfilLocal?.seguidos),
    bio: perfilLocal?.bio || "",
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

function obtenerTimestampPublicacion(publicacion) {
  if (!publicacion || typeof publicacion !== "object") {
    return 0;
  }

  const valorFecha =
    publicacion.creationDate ??
    publicacion.timestamp ??
    publicacion.fechaCreacion ??
    null;

  if (!valorFecha) {
    return 0;
  }

  const timestamp = new Date(valorFecha).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function ordenarContenedoresPublicaciones(feedPublicaciones) {
  if (!feedPublicaciones) return;

  const contenedores = Array.from(
    feedPublicaciones.querySelectorAll(".contenedor-publicacion"),
  );

  const ejemplos = [];
  const publicaciones = [];

  contenedores.forEach((contenedor) => {
    const publicacion = contenedor.querySelector(".publicacion");
    if (!publicacion) return;

    if (
      publicacion.id === "pub_ejemplo_1" ||
      publicacion.id === "pub_ejemplo_2"
    ) {
      ejemplos.push(contenedor);
      return;
    }

    const timestamp = Number(publicacion.dataset.timestamp || 0);
    publicaciones.push({ contenedor, timestamp });
  });

  publicaciones.sort((a, b) => b.timestamp - a.timestamp);

  [...ejemplos, ...publicaciones.map((item) => item.contenedor)].forEach(
    (contenedor) => {
      feedPublicaciones.appendChild(contenedor);
    },
  );
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

    const publicacionesOrdenadas = [...publicaciones].sort(
      (a, b) => obtenerTimestampPublicacion(b) - obtenerTimestampPublicacion(a),
    );

    // Filtrar solo publicaciones que no existan ya en el DOM
    const publicacionesNuevas = publicacionesOrdenadas.filter((pub) => {
      const backendId = pub.id;
      const frontendId = `pub_${backendId}`;
      return (
        !publicacionesExistentesIds.includes(frontendId) &&
        !publicacionesExistentesIds.includes(backendId)
      );
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
      // Del backend (nuevo formato: tiene description o user)
      if (publicacionData.description !== undefined || publicacionData.user) {
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

    ordenarContenedoresPublicaciones(feedPublicaciones);

    const fuente = backendConectado && usarBackend ? "backend" : "localStorage";
    console.log(
      `✅ ${publicacionesNuevas.length} publicaciones nuevas cargadas desde ${fuente}`,
    );
  } catch (error) {
    console.error("❌ Error al cargar publicaciones:", error);
  }
}

// Función para crear publicación desde datos del backend (nuevo formato)
function crearPublicacionDesdeBackend(
  publicacionData,
  insertarDespuesDe,
  feedPublicaciones,
) {
  const pubId = `pub_${publicacionData.id}`;
  const publicationIdBackend = Number(publicacionData.id);
  const autor = publicacionData.user || "Usuario";
  const username = publicacionData.username || "usuario";
  const avatar = publicacionData.profilePhoto || "./assets/Logo/UFGPerfil.jpg";
  const handle = `@${username}`;
  const description = publicacionData.description || "";
  const likes = publicacionData.likes || 0;
  const coments = publicacionData.coments || 0;
  const timestamp = publicacionData.creationDate
    ? new Date(publicacionData.creationDate).getTime()
    : Date.now();
  const { htmlMedia, totalSlides } = construirCarruselMedia(
    publicacionData,
    pubId,
  );

  // Verificar si la publicación es del usuario actual para mostrar menú de opciones
  const esDelUsuarioActual = puedeEliminarPublicacion(publicacionData);

  const menuOpciones = esDelUsuarioActual
    ? `
    <div class="menu-opciones">
      <button class="btn-menu-publicacion" onclick="toggleMenuPublicacion('${pubId}')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      <div class="menu-dropdown-publicacion" id="menu-pub-${pubId}">
        <button class="menu-opcion eliminar" onclick="eliminarPublicacion(${publicationIdBackend}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar publicación
        </button>
      </div>
    </div>
  `
    : "";

  const htmlPublicacion = `
    <div class="publicacion" id="${pubId}" data-timestamp="${timestamp}" data-publication-id="${publicacionData.id}" data-pubid="${publicacionData.id}">
      <div class="usuario-info">
        <div class="avatar">
          <img src="${avatar}" alt="${autor}">
        </div>
        <div class="usuario-datos">
          <h4>${autor}</h4>
          <p class="usuario-handle">${handle}</p>
          <p class="tiempo-publicacion">${tiempoTranscurrido(publicacionData.creationDate)}</p>
        </div>
        ${menuOpciones}
      </div>
      <div class="contenido-publicacion">
        ${description ? `<p>${description}</p>` : ""}
        ${htmlMedia}
      </div>
      <div class="separador"></div>
      <div class="acciones-publicacion">
        <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, ${publicationIdBackend})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span>${likes}</span>
        </button>
        <button class="accion-btn comentarios" onclick="alternarComentarios(${publicationIdBackend}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          <span>${coments}</span>
        </button>
      </div>
      ${generarHTMLComentarios(pubId)}
    </div>`;

  const contenedor = document.createElement("div");
  contenedor.className = "contenedor-publicacion";
  contenedor.innerHTML = htmlPublicacion;

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

  if (totalSlides > 1) {
    inicializarCarruselPublicacion(
      pubId,
      totalSlides,
      contenedor.querySelector(".publicacion"),
    );
  }

  // Inicializar estado del like
  inicializarLikePublicacion(
    publicationIdBackend,
    contenedor.querySelector(".publicacion"),
  );

  ordenarContenedoresPublicaciones(feedPublicaciones);
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

  // Inicializar estado del like
  const pubElement = contenedor.querySelector(".publicacion");
  if (pubElement && pubElement.id) {
    inicializarLikePublicacion(
      Number(pubElement.dataset.publicationId || pubElement.dataset.pubid) ||
        pubElement.id,
      pubElement,
    );
  }
}

// ===========================================
// RENDER DE COMENTARIOS DEL BACKEND
// ===========================================

function mostrarComentariosBackend(publicacionId, comentarios) {
  const publicacion = document.getElementById(publicacionId);

  if (!publicacion) {
    console.warn(
      "No se encontró la publicación para mostrar comentarios:",
      publicacionId,
    );
    return;
  }

  const seccionComentarios = publicacion.querySelector(".seccion-comentarios");

  if (!seccionComentarios) {
    console.warn("No se encontró la sección de comentarios:", publicacionId);
    return;
  }

  const listaComentarios =
    seccionComentarios.querySelector(".lista-comentarios");

  if (!listaComentarios) {
    console.warn("No se encontró la lista de comentarios:", publicacionId);
    return;
  }

  listaComentarios.innerHTML = "";

  if (!Array.isArray(comentarios) || comentarios.length === 0) {
    listaComentarios.innerHTML = `
      <div class="comentario-vacio">
        <p>No hay comentarios todavía.</p>
      </div>
    `;
    return;
  }

  const datosUsuario = obtenerDatosUsuario();

  comentarios.forEach((comentario) => {
    const comentarioNormalizado =
      comentario?.backendId !== undefined
        ? comentario
        : normalizarComentarioBackend(comentario);

    if (!comentarioNormalizado) return;

    const esComentarioPropio = puedeEliminarComentario(
      comentarioNormalizado,
      datosUsuario,
    );

    const elementoComentario = document.createElement("div");
    elementoComentario.className = "comentario";
    elementoComentario.dataset.commentId = comentarioNormalizado.backendId;
    elementoComentario.id = comentarioNormalizado.id;

    elementoComentario.innerHTML = `
      <img 
        src="${comentarioNormalizado.avatar}" 
        alt="${comentarioNormalizado.username}" 
        class="avatar-comentario"
      >

      <div class="contenido-comentario">
        <div class="autor-comentario">
          <strong>${comentarioNormalizado.nombre}</strong>
          <span class="handle-comentario">${comentarioNormalizado.handle}</span>
          <span class="tiempo-comentario">${tiempoTranscurrido(comentarioNormalizado.fechaCreacion)}</span>
        </div>

        <p>${comentarioNormalizado.contenido}</p>

        ${
          esComentarioPropio
            ? `
        <button
          class="btn-eliminar-comentario"
          onclick="manejarEliminarComentario('${comentarioNormalizado.id}', '${publicacionId}')"
          title="Eliminar comentario"
        >
          Eliminar
        </button>`
            : ""
        }
      </div>
    `;

    listaComentarios.appendChild(elementoComentario);
  });
}

// Manejar eliminación visual + backend
async function manejarEliminarComentario(commentId, publicacionId) {
  const eliminado = await eliminarComentarioBackend(commentId);

  if (!eliminado) {
    mostrarNotificacion("No se pudo eliminar el comentario", "error");
    return;
  }

  const comentarioElement = document.getElementById(commentId);

  if (comentarioElement) {
    comentarioElement.remove();
  }

  const publicacion = document.getElementById(publicacionId);

  if (publicacion) {
    const botonComentarios = publicacion.querySelector(
      ".accion-btn.comentarios span",
    );

    if (botonComentarios) {
      const cantidadActual = parseInt(botonComentarios.textContent) || 0;
      botonComentarios.textContent = Math.max(cantidadActual - 1, 0);
    }
  }

  mostrarNotificacion("Comentario eliminado", "success");
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
      inicializarCarruselPublicacion(publicacionId, slides.length, publicacion);
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
  cargarSugerenciasUsuarios();

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

  // Configurar auto-resize para el textarea de publicación principal
  const textareaPublicacion = document.getElementById("texto-publicacion");
  if (
    textareaPublicacion &&
    !textareaPublicacion.hasAttribute("data-autoresize")
  ) {
    const ajustarAltura = function () {
      this.style.height = "60";
      this.style.height = this.scrollHeight + "px";
    };

    const actualizarContador = function () {
      const contador = document.getElementById("contador-texto");
      if (!contador) return;
      const texto = this.value || "";
      const caracteres = texto.length;
      const lineas = texto === "" ? 1 : texto.split("\n").length;
      contador.textContent = `${caracteres} caracteres · ${lineas} línea${lineas !== 1 ? "s" : ""}`;
    };

    const handleInput = function () {
      ajustarAltura.call(this);
      actualizarContador.call(this);
    };

    textareaPublicacion.addEventListener("input", handleInput);
    textareaPublicacion.addEventListener("change", handleInput);
    textareaPublicacion.addEventListener("paste", function () {
      const self = this;
      setTimeout(function () {
        handleInput.call(self);
      }, 0);
    });

    // Ajustar al cargar si ya tiene contenido
    ajustarAltura.call(textareaPublicacion);
    actualizarContador.call(textareaPublicacion);
    textareaPublicacion.setAttribute("data-autoresize", "true");
  }

  //Evento para volver a inicio
  document.getElementById("inicio").addEventListener("click", function () {
    const miPerfil = document.querySelector(".mi-perfil");
    const sugerencias = document.querySelector(".sugerencias");
    const publicaciones = document.querySelector(".publicaciones");
    const publicacionesIndividuales = document.querySelectorAll(".publicacion");
    const feedPublicaciones = document.querySelectorAll(".feed-publicaciones");

    if (miPerfil) miPerfil.style.display = "";
    if (sugerencias) sugerencias.style.display = "";
    if (publicaciones) publicaciones.style.display = "";
    publicacionesIndividuales.forEach((element) => {
      element.style.display = "";
    });
    feedPublicaciones.forEach((element) => {
      element.style.display = "";
    });
    document.querySelectorAll(".contenedor-publicacion").forEach((element) => {
      element.style.display = "";
    });
    const marketplace = document.querySelector(".marketplace");
    const tituloComunidad = document.querySelector(".titulo-comunidad");
    const tituloMarketplace = document.querySelector(".titulo-marketplace");
    const tituloPerfil = document.querySelector(".titulo-perfil");
    const tituloInicio = document.querySelector(".titulo-inicio");

    if (marketplace) marketplace.style.display = "none";
    if (tituloComunidad) tituloComunidad.style.display = "none";
    if (tituloMarketplace) tituloMarketplace.style.display = "none";
    if (tituloPerfil) tituloPerfil.style.display = "none";
    if (tituloInicio) tituloInicio.style.display = "";
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

  if (!modal || !imagenExpandida) {
    console.error("Modal de imagen no encontrado en el DOM");
    return;
  }

  // Configurar la imagen en el modal
  imagenExpandida.src = src;
  imagenExpandida.alt = alt;

  // Mostrar el modal
  modal.classList.add("active");
  modal.style.display = "flex";

  // Prevenir scroll del body
  document.body.style.overflow = "hidden";
}

// Función para cerrar modal
function cerrarModal() {
  const modal = document.getElementById("modal-imagen");

  if (!modal) return;

  // Ocultar el modal
  modal.classList.remove("active");
  modal.style.display = "none";

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

function toggleMenuHamburguesaCelular(forzarEstado = null) {
  const panel = document.getElementById("panel-hamburguesa-celular");
  const boton = document.getElementById("btn-hamburguesa-celular");

  if (!panel || !boton) return;

  const abierto = panel.classList.contains("activo");
  const debeAbrir = typeof forzarEstado === "boolean" ? forzarEstado : !abierto;

  panel.classList.toggle("activo", debeAbrir);
  panel.setAttribute("aria-hidden", debeAbrir ? "false" : "true");
  boton.setAttribute("aria-expanded", debeAbrir ? "true" : "false");
  boton.classList.toggle("activo", debeAbrir);
  document.body.classList.toggle("menu-celular-abierto", debeAbrir);
}

function cerrarMenuHamburguesaCelular() {
  toggleMenuHamburguesaCelular(false);
}

document.addEventListener("DOMContentLoaded", function () {
  const botonHamburguesa = document.getElementById("btn-hamburguesa-celular");
  const panelHamburguesa = document.getElementById("panel-hamburguesa-celular");

  if (botonHamburguesa) {
    botonHamburguesa.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenuHamburguesaCelular();
    });
  }

  if (panelHamburguesa) {
    panelHamburguesa.addEventListener("click", function (event) {
      event.stopPropagation();
      if (event.target === panelHamburguesa) {
        cerrarMenuHamburguesaCelular();
      }
    });
  }

  document.addEventListener("click", function (event) {
    const contenedor = event.target.closest(".menu-secciones-celular");
    if (!contenedor) {
      cerrarMenuHamburguesaCelular();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      cerrarMenuHamburguesaCelular();
    }
  });
});

// Función para seleccionar ventana en el sidebar
function seleccionarVentana(botonSeleccionado) {
  // Remover clase active de todos los botones del sidebar
  const botonesSidebar = document.querySelectorAll(
    ".secciones button, .panel-hamburguesa-celular button",
  );
  botonesSidebar.forEach((boton) => {
    boton.classList.remove("active");
    boton.style.transform = "translateY(0)";
    // Pequeña animación de salida
    setTimeout(() => {
      boton.style.transform = "translateY(0)";
    }, 150);
  });

  // Obtener el ID del botón y cambiar la vista
  const botonId = botonSeleccionado?.dataset?.section || botonSeleccionado.id;

  // Agregar clase active al botón seleccionado (desktop y móvil)
  botonesSidebar.forEach((boton) => {
    const seccionBoton = boton?.dataset?.section || boton.id;
    if (seccionBoton === botonId) {
      boton.classList.add("active");
      boton.style.transform = "translateY(-10px) scale(1.05)";
      setTimeout(() => {
        boton.style.transform = "translateY(0) scale(1)";
      }, 300);
    }
  });

  if (window.innerWidth <= 768) {
    cerrarMenuHamburguesaCelular();
  }

  // Ocultar todos los títulos de sección
  document.querySelector(".titulo-inicio").style.display = "none";
  document.querySelector(".titulo-marketplace").style.display = "none";
  document.querySelector(".titulo-comunidad").style.display = "none";
  document.querySelector(".titulo-perfil").style.display = "none";

  const seccionPerfil = document.querySelector(".seccion-perfil");
  const miPerfil = document.querySelector(".mi-perfil");
  const publicaciones = document.querySelector(".publicaciones");
  const feedPublicaciones = document.querySelector(".feed-publicaciones");
  const feedMisPublicaciones = document.querySelector(
    ".contenido .feed-mis-publicaciones",
  );
  const sugerencias = document.querySelector(".sugerencias");
  const solicitudes = document.querySelector(".solicitudes");
  const seguidos = document.querySelector(".seguidos");
  const seguidoresContenedor = document.querySelector(".seguidores-contenedor");
  const esMovil = window.matchMedia("(max-width: 768px)").matches;

  const mostrarContenedoresPerfilMovil = (mostrar) => {
    if (!esMovil) return;

    if (miPerfil) {
      miPerfil.style.display = mostrar ? "flex" : "none";
    }
  };

  const mostrarContenedoresComunidadMovil = (mostrar) => {
    if (!esMovil) return;

    if (miPerfil) {
      miPerfil.style.display = "none";
    }

    if (seguidos) {
      seguidos.style.display = "none";
    }

    if (seguidoresContenedor) {
      seguidoresContenedor.style.display = "none";
    }

    if (feedMisPublicaciones) {
      feedMisPublicaciones.style.display = "none";
    }

    if (sugerencias) {
      sugerencias.style.display = mostrar ? "flex" : "none";
    }

    if (solicitudes) {
      solicitudes.style.display = mostrar ? "block" : "none";
    }
  };

  // Cambiar vista según el botón seleccionado
  if (botonId === "inicio") {
    const tituloInicio = document.querySelector(".titulo-inicio");
    if (tituloInicio) tituloInicio.style.display = ""; // permitir que CSS determine display
    if (publicaciones) publicaciones.style.display = "";
    if (seccionPerfil) seccionPerfil.style.display = "none";
    mostrarContenedoresPerfilMovil(false);
    if (feedPublicaciones) feedPublicaciones.style.display = "";
    if (feedMisPublicaciones) feedMisPublicaciones.style.display = "none";
    if (esMovil && sugerencias) sugerencias.style.display = "none";
    if (esMovil && solicitudes) solicitudes.style.display = "none";
    if (!esMovil && sugerencias) sugerencias.style.display = "";
    if (!esMovil && solicitudes) solicitudes.style.display = "";
    if (seguidos) seguidos.style.display = "none";
    if (seguidoresContenedor) seguidoresContenedor.style.display = "none";
  } else if (botonId === "btn-marketplace") {
    const tituloMarketplace = document.querySelector(".titulo-marketplace");
    if (tituloMarketplace) tituloMarketplace.style.display = "";
    if (publicaciones) publicaciones.style.display = "none";
    if (seccionPerfil) seccionPerfil.style.display = "none";
    mostrarContenedoresPerfilMovil(false);
    if (feedPublicaciones) feedPublicaciones.style.display = "none";
    if (feedMisPublicaciones) feedMisPublicaciones.style.display = "none";
    if (esMovil && sugerencias) sugerencias.style.display = "none";
    if (esMovil && solicitudes) solicitudes.style.display = "none";
  } else if (botonId === "comunidad") {
    const tituloComunidad = document.querySelector(".titulo-comunidad");
    if (tituloComunidad) tituloComunidad.style.display = "";
    if (publicaciones) publicaciones.style.display = "none";
    if (seccionPerfil) seccionPerfil.style.display = "none";
    mostrarContenedoresPerfilMovil(false);
    mostrarContenedoresComunidadMovil(true);
    if (feedPublicaciones) feedPublicaciones.style.display = "none";
    if (feedMisPublicaciones) feedMisPublicaciones.style.display = "none";
    if (!esMovil && sugerencias) sugerencias.style.display = "none";
    if (!esMovil && solicitudes) solicitudes.style.display = "none";
  } else if (botonId === "perfil") {
    const tituloPerfil = document.querySelector(".titulo-perfil");
    if (tituloPerfil) tituloPerfil.style.display = "";
    if (publicaciones) publicaciones.style.display = "none";
    if (seccionPerfil) seccionPerfil.style.display = "block";
    mostrarContenedoresPerfilMovil(true);
    if (esMovil) {
      if (sugerencias) sugerencias.style.display = "none";
      if (solicitudes) solicitudes.style.display = "none";
    }
    if (feedPublicaciones) feedPublicaciones.style.display = "none";
    if (!esMovil && solicitudes) solicitudes.style.display = "none";
    if (!esMovil && sugerencias) sugerencias.style.display = "none";
    if (seguidos) seguidos.style.display = "";
    if (seguidoresContenedor) seguidoresContenedor.style.display = "";
    const feedMisPublicacionesPerfil = obtenerContenedorMisPublicaciones();
    if (feedMisPublicacionesPerfil) {
      feedMisPublicacionesPerfil.style.display = "flex";
    }
    recargarSistemaFollow().catch((error) => {
      console.error("Error recargando follows:", error);
    });
    cargarPublicacionesMiPerfil().catch((error) => {
      console.error("Error al cargar publicaciones del perfil:", error);
    });
  }
}

document.addEventListener("click", async function (event) {
  const boton = event.target.closest("button[data-follow-action]");
  if (!boton) return;

  const accion = boton.dataset.followAction;
  const requesterId = obtenerIdUsuarioActualParaFollow();
  const requestId =
    boton.dataset.requestId ||
    boton.closest(".perfil-usuarios")?.dataset.requestId;
  const userId =
    boton.dataset.userId || boton.closest(".perfil-usuarios")?.dataset.userId;
  const followerId =
    boton.dataset.followerId ||
    boton.closest(".perfil-usuarios")?.dataset.followerId;
  const followedId =
    boton.dataset.followedId ||
    boton.closest(".perfil-usuarios")?.dataset.followedId;

  if (!requesterId) {
    mostrarNotificacion("Debes iniciar sesión para usar follows", "error");
    return;
  }

  try {
    if (
      accion === "send-request" ||
      accion === "follow-back" ||
      accion === "follow-follower"
    ) {
      if (!userId) {
        mostrarNotificacion(
          "No se pudo identificar el usuario a seguir",
          "error",
        );
        return;
      }

      const idsSeguidos = await obtenerIdsUsuariosSeguidos(requesterId);
      const solicitudesEnviadas = await obtenerSolicitudesEnviadas(requesterId);
      const receiverNumericId = Number(userId);

      if (
        Number.isFinite(receiverNumericId) &&
        solicitudesEnviadas.some(
          (item) =>
            Number(item.receiverId) === receiverNumericId &&
            String(item.status).toUpperCase() === "PENDIENTE",
        )
      ) {
        if (boton) {
          boton.textContent = "Solicitud enviada";
          boton.disabled = true;
          boton.classList.remove("seguir");
          boton.classList.add("solicitud-enviada");
          boton.dataset.followAction = "pending";
        }
        mostrarNotificacion("Ya existe una solicitud pendiente", "info");
        return;
      }

      if (
        Number.isFinite(receiverNumericId) &&
        idsSeguidos.includes(receiverNumericId)
      ) {
        if (boton) {
          boton.textContent = "Dejar de seguir";
          boton.disabled = false;
          boton.classList.remove("btn-seguir");
          boton.classList.add("dejar-de-seguir");
          boton.dataset.followAction = "unfollow-followed";
          boton.dataset.followedId = String(receiverNumericId);
        }
        mostrarNotificacion("Ya sigues a este usuario", "info");
        return;
      }

      await enviarSolicitudSeguimiento(requesterId, userId);
      actualizarBotonSolicitudEnviada(boton);
      mostrarNotificacion("Solicitud enviada", "success");
      return;
    }

    if (accion === "accept-request") {
      if (!requestId) {
        mostrarNotificacion("No se pudo identificar la solicitud", "error");
        return;
      }

      await aceptarSolicitudSeguimiento(requestId);
      await recargarSistemaFollow();
      mostrarNotificacion("Solicitud aceptada", "success");
      return;
    }

    if (accion === "reject-request") {
      if (!requestId) {
        mostrarNotificacion("No se pudo identificar la solicitud", "error");
        return;
      }

      await rechazarSolicitudSeguimiento(requestId);
      await recargarSistemaFollow();
      mostrarNotificacion("Solicitud rechazada", "info");
      return;
    }

    if (accion === "remove-follower") {
      const followerUserId = followerId || userId;

      if (!followerUserId) {
        mostrarNotificacion(
          "No se pudo identificar al seguidor a eliminar",
          "error",
        );
        return;
      }

      await eliminarSeguidor(followerUserId);
      await recargarSistemaFollow();
      mostrarNotificacion("Eliminaste a este seguidor", "info");
      return;
    }

    if (accion === "unfollow" || accion === "unfollow-followed") {
      const followedUserId = followedId || userId;

      if (!followedUserId) {
        mostrarNotificacion(
          "No se pudo identificar el usuario seguido",
          "error",
        );
        return;
      }

      await dejarDeSeguir(followedUserId);
      await recargarSistemaFollow();
      mostrarNotificacion("Dejaste de seguir a este usuario", "info");
    }
  } catch (error) {
    console.error("Error ejecutando follow:", error);
    mostrarNotificacion(
      error.message || "No se pudo completar la acción",
      "error",
    );
  }
});

// Botones para cambiar de seccion

// Variables para manejo de archivos multimedia
let imagenesSeleccionadas = [];
const MAX_IMAGENES_PUBLICACION = 5;
const MAX_VIDEOS_PUBLICACION = 1;

function obtenerArchivosPublicacion(archivos = []) {
  const archivosValidos = Array.isArray(archivos)
    ? archivos
        .map((item) => item?.archivo || item?.file || item)
        .filter((archivo) => archivo instanceof File)
    : [];

  const imageFiles = archivosValidos.filter((file) =>
    file.type.startsWith("image/"),
  );
  const videoFiles = archivosValidos.filter((file) =>
    file.type.startsWith("video/"),
  );
  const invalidFiles = archivosValidos.filter(
    (file) =>
      !file.type.startsWith("image/") && !file.type.startsWith("video/"),
  );

  return {
    imageFiles,
    videoFiles,
    invalidFiles,
  };
}

function validarArchivosPublicacion(imageFiles = [], videoFiles = []) {
  if (imageFiles.length > MAX_IMAGENES_PUBLICACION) {
    return "Solo puedes subir un máximo de 5 imágenes";
  }

  if (videoFiles.length > MAX_VIDEOS_PUBLICACION) {
    return "Solo puedes subir un video por publicación";
  }

  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) {
      return "Solo se permiten imágenes en el campo de imágenes";
    }
  }

  for (const file of videoFiles) {
    if (!file.type.startsWith("video/")) {
      return "El archivo seleccionado no es un video";
    }
  }

  return null;
}

// Función para abrir el selector de imágenes
function abrirSelectorImagenes() {
  const selectorImagenes = document.getElementById("selector-imagenes");
  const { imageFiles } = obtenerArchivosPublicacion(imagenesSeleccionadas);

  if (imageFiles.length >= MAX_IMAGENES_PUBLICACION) {
    alert("Solo puedes subir un máximo de 5 imágenes");
    return;
  }

  selectorImagenes.accept = "image/*,image/jpeg,image/png,image/gif,image/webp";
  selectorImagenes.multiple = true;

  selectorImagenes.value = "";
  selectorImagenes.click();
}

// Función para abrir el selector solo de videos
function abrirSelectorVideos() {
  const selectorImagenes = document.getElementById("selector-imagenes");
  const { videoFiles } = obtenerArchivosPublicacion(imagenesSeleccionadas);

  if (videoFiles.length >= MAX_VIDEOS_PUBLICACION) {
    alert("Solo puedes subir un video por publicación");
    return;
  }

  selectorImagenes.accept = "video/*,video/mp4,video/webm,video/ogg";
  selectorImagenes.multiple = false;

  selectorImagenes.value = "";
  selectorImagenes.click();
}

// Función para manejar la selección de imágenes
function manejarSeleccionImagenes(event) {
  const archivos = Array.from(event.target.files);
  const previewContainer = document.getElementById("preview-imagenes");
  const listaPreview = document.getElementById("lista-preview-imagenes");

  if (archivos.length === 0) {
    return;
  }

  const { imageFiles: imagenesActuales, videoFiles: videosActuales } =
    obtenerArchivosPublicacion(imagenesSeleccionadas);
  const archivosPermitidos = [];
  let avisoTipoInvalidoMostrado = false;
  let avisoLimiteImagenesMostrado = false;
  let avisoLimiteVideosMostrado = false;

  let totalImagenes = imagenesActuales.length;
  let totalVideos = videosActuales.length;

  archivos.forEach((archivo) => {
    if (!(archivo instanceof File)) {
      return;
    }

    if (archivo.type.startsWith("image/")) {
      if (totalImagenes >= MAX_IMAGENES_PUBLICACION) {
        if (!avisoLimiteImagenesMostrado) {
          alert("Solo puedes subir un máximo de 5 imágenes");
          avisoLimiteImagenesMostrado = true;
        }
        return;
      }

      totalImagenes += 1;
      archivosPermitidos.push(archivo);
      return;
    }

    if (archivo.type.startsWith("video/")) {
      if (totalVideos >= MAX_VIDEOS_PUBLICACION) {
        if (!avisoLimiteVideosMostrado) {
          alert("Solo puedes subir un video por publicación");
          avisoLimiteVideosMostrado = true;
        }
        return;
      }

      totalVideos += 1;
      archivosPermitidos.push(archivo);
      return;
    }

    if (!avisoTipoInvalidoMostrado) {
      alert("Solo se permiten imágenes o videos");
      avisoTipoInvalidoMostrado = true;
    }
  });

  if (archivosPermitidos.length === 0) {
    event.target.value = "";
    return;
  }

  if (imagenesSeleccionadas.length === 0) {
    previewContainer.style.display = "block";
  }

  let imagenesProcessadas = 0;
  const totalArchivos = archivosPermitidos.length;

  archivosPermitidos.forEach((archivo) => {
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

      if (imagenesProcessadas === totalArchivos) {
        actualizarContadorImagenes();
        event.target.value = "";
      }
    };

    reader.onerror = function () {
      console.error(`Error al leer el archivo: ${archivo.name}`);
      imagenesProcessadas++;
      if (imagenesProcessadas === totalArchivos) {
        actualizarContadorImagenes();
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
  const { imageFiles, videoFiles } = obtenerArchivosPublicacion(
    imagenesSeleccionadas,
  );
  const imagenes = imageFiles.length;
  const videos = videoFiles.length;
  const imagenesDisponibles = Math.max(MAX_IMAGENES_PUBLICACION - imagenes, 0);
  const videosDisponibles = Math.max(MAX_VIDEOS_PUBLICACION - videos, 0);

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

  if (imagenesDisponibles === 0 && videosDisponibles === 0) {
    texto += " (límite multimedia alcanzado)";
  } else {
    texto += ` (puedes agregar ${imagenesDisponibles} imagen${imagenesDisponibles !== 1 ? "es" : ""} y ${videosDisponibles} video${videosDisponibles !== 1 ? "s" : ""} más)`;
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
                    <circle cx="12" cy="12" r="12" fill="#02a2ff"/>
                    <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" fill="white"/>
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
    const exito = await crearNuevaPublicacion(
      textoPublicacion,
      imagenesSeleccionadas,
      encuestaActual,
    );

    if (exito) {
      // Limpiar formulario solo si la publicación fue exitosa
      const ta = document.getElementById("texto-publicacion");
      if (ta) {
        ta.value = "";
        ta.style.height = ""; // restablecer a la altura mínima definida en CSS
        const contador = document.getElementById("contador-texto");
        if (contador) contador.textContent = "0 caracteres · 1 línea";
      }
      limpiarImagenes();
      ocultarIndicadorEncuesta();
      encuestaActual = null;
      console.log("✅ Publicación creada exitosamente");
    }
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

// Función para crear una nueva publicación (usa backend exclusivamente)
async function crearNuevaPublicacion(texto, imagenes, encuesta = null) {
  if (publicacionEnCurso) {
    console.warn(
      "⏳ Ya existe una publicación en curso. Se ignora el intento duplicado.",
    );
    return false;
  }

  publicacionEnCurso = true;
  actualizarEstadoBotonPublicar(true);

  try {
    console.log("📝 Creando nueva publicación...");

    const { imageFiles, videoFiles, invalidFiles } = obtenerArchivosPublicacion(
      imagenes || [],
    );

    if (invalidFiles.length > 0) {
      await showAlert("Solo se permiten imágenes y videos válidos.");
      return false;
    }

    const mensajeValidacion = validarArchivosPublicacion(
      imageFiles,
      videoFiles,
    );
    if (mensajeValidacion) {
      await showAlert(mensajeValidacion);
      return false;
    }

    console.log("📡 Guardando en backend...");
    const publicacionBackend = await crearPublicacionBackend(texto, imagenes);

    if (publicacionBackend) {
      console.log("✅ Publicación guardada en backend:", publicacionBackend.id);

      // Crear la publicación en el frontend usando los datos del backend
      crearPublicacionEnFrontend(publicacionBackend, true);

      mostrarNotificacion("¡Publicación creada exitosamente!", "success");
      return true;
    } else {
      console.warn("⚠️ Error al guardar en backend");
      mostrarNotificacion("Error al crear la publicación", "error");
      return false;
    }
  } catch (error) {
    console.error("❌ Error creando publicación:", error);
    mostrarNotificacion("Error al crear la publicación", "error");
    return false;
  } finally {
    publicacionEnCurso = false;
    actualizarEstadoBotonPublicar(false);
  }
}

// Función para crear publicación en el frontend usando datos del backend (nuevo formato)
function crearPublicacionEnFrontend(publicacionData, esDelBackend = false) {
  const feedPublicaciones = document.querySelector(".feed-publicaciones");
  const pubId = `pub_${publicacionData.id}`;
  const publicationIdBackend = Number(publicacionData.id);
  const timestamp = publicacionData.creationDate
    ? new Date(publicacionData.creationDate).getTime()
    : Date.now();

  const autor =
    publicacionData.user || obtenerDatosUsuario().username || "Usuario";
  const username =
    publicacionData.username ||
    obtenerDatosUsuario().handle?.replace("@", "") ||
    "usuario";
  const avatar =
    publicacionData.profilePhoto ||
    obtenerDatosUsuario().avatar ||
    "./assets/Logo/UFGPerfil.jpg";
  const handle = `@${username}`;
  const description = publicacionData.description || "";
  const { htmlMedia, totalSlides } = construirCarruselMedia(
    publicacionData,
    pubId,
  );

  // Verificar si la publicación es del usuario actual para mostrar menú de opciones
  const esDelUsuarioActualFront = puedeEliminarPublicacion(publicacionData);

  const menuOpcionesFront = esDelUsuarioActualFront
    ? `
    <div class="menu-opciones">
      <button class="btn-menu-publicacion" onclick="toggleMenuPublicacion('${pubId}')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      <div class="menu-dropdown-publicacion" id="menu-pub-${pubId}">
        <button class="menu-opcion eliminar" onclick="eliminarPublicacion(${publicationIdBackend}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar publicación
        </button>
      </div>
    </div>
  `
    : "";

  const htmlPublicacion = `
    <div class="publicacion" id="${pubId}" data-timestamp="${timestamp}" data-publication-id="${publicacionData.id}" data-pubid="${publicacionData.id}">
      <div class="usuario-info">
        <div class="avatar"><img src="${avatar}" alt="${autor}"></div>
        <div class="usuario-datos">
          <h4>${autor}</h4>
          <p class="usuario-handle">${handle}</p>
          <p class="tiempo-publicacion">${tiempoTranscurrido(publicacionData.creationDate)}</p>
        </div>
        ${menuOpcionesFront}
      </div>
      <div class="contenido-publicacion">
        ${description ? `<p>${description}</p>` : ""}
        ${htmlMedia}
      </div>
      <div class="separador"></div>
      <div class="acciones-publicacion">
        <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, ${publicationIdBackend})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span>${publicacionData.likes || 0}</span>
        </button>
        <button class="accion-btn comentarios" onclick="alternarComentarios(${publicationIdBackend}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          <span>${publicacionData.coments || 0}</span>
        </button>
      </div>
      ${generarHTMLComentarios(pubId)}
    </div>`;

  const contenedorPublicacion = document.createElement("div");
  contenedorPublicacion.className = "contenedor-publicacion";
  contenedorPublicacion.innerHTML = htmlPublicacion;

  contenedorPublicacion.style.opacity = "0";
  contenedorPublicacion.style.transform = "translateY(-20px)";
  contenedorPublicacion.style.transition =
    "opacity 0.3s ease, transform 0.3s ease";

  const primerElemento = feedPublicaciones.querySelector(
    ".contenedor-publicacion",
  );
  if (primerElemento) {
    let insertarDespues = null;
    for (const el of feedPublicaciones.querySelectorAll(
      ".contenedor-publicacion",
    )) {
      const pid = el.querySelector(".publicacion")?.id;
      if (pid === "pub_ejemplo_1" || pid === "pub_ejemplo_2")
        insertarDespues = el;
      else break;
    }
    if (insertarDespues && insertarDespues.nextElementSibling)
      feedPublicaciones.insertBefore(
        contenedorPublicacion,
        insertarDespues.nextElementSibling,
      );
    else if (insertarDespues)
      insertarDespues.parentNode.insertBefore(
        contenedorPublicacion,
        insertarDespues.nextElementSibling,
      );
    else feedPublicaciones.insertBefore(contenedorPublicacion, primerElemento);
  } else {
    feedPublicaciones.appendChild(contenedorPublicacion);
  }

  setTimeout(() => {
    contenedorPublicacion.style.opacity = "1";
    contenedorPublicacion.style.transform = "translateY(0)";
  }, 10);

  if (totalSlides > 1)
    inicializarCarruselPublicacion(
      pubId,
      totalSlides,
      contenedorPublicacion.querySelector(".publicacion"),
    );

  // Inicializar estado del like
  inicializarLikePublicacion(
    publicationIdBackend,
    contenedorPublicacion.querySelector(".publicacion"),
  );

  ordenarContenedoresPublicaciones(feedPublicaciones);
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
                <button class="btn-anterior" onclick="cambiarSlidePublicacion('${publicacionId}', -1, this)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <button class="btn-siguiente" onclick="cambiarSlidePublicacion('${publicacionId}', 1, this)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                
                <!-- Indicadores -->
                <div class="indicadores">
                    ${imagenes
                      .map(
                        (_, index) => `
                        <div class="indicador ${index === 0 ? "active" : ""}" onclick="irSlidePublicacion('${publicacionId}', ${index}, this)"></div>
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
            <button class="accion-btn me-gusta" onclick="alternarMeGusta(this, '${publicacionId}')">
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
    inicializarCarruselPublicacion(
      publicacionId,
      imagenes.length,
      nuevaPublicacion,
    );
  }

  // Inicializar estado del like
  inicializarLikePublicacion(publicacionId);

  console.log("✅ Publicación creada localmente");
  mostrarNotificacion("¡Publicación creada!", "success");
}

// Sistema de carruseles para publicaciones dinámicas
const carruselesPublicaciones = new WeakMap();

function obtenerCarruselPublicacion(publicacionId, referencia = null) {
  const publicacion = obtenerPublicacionElemento(publicacionId, referencia);
  if (!publicacion) return null;

  const slides = publicacion.querySelectorAll(".imagen-slide");
  if (!slides.length) return null;

  let carrusel = carruselesPublicaciones.get(publicacion);
  if (!carrusel || carrusel.totalSlides !== slides.length) {
    carrusel = {
      slideActual: 0,
      totalSlides: slides.length,
    };
    carruselesPublicaciones.set(publicacion, carrusel);
  }

  return {
    publicacion,
    slides,
    indicadores: publicacion.querySelectorAll(".indicador"),
    contadorActual: publicacion.querySelector(".imagen-actual"),
    carrusel,
  };
}

function actualizarCarruselPublicacion(
  publicacionId,
  nuevoIndice,
  referencia = null,
) {
  const estado = obtenerCarruselPublicacion(publicacionId, referencia);
  if (!estado) return;

  const { slides, indicadores, contadorActual, carrusel } = estado;
  const indiceAnterior = carrusel.slideActual;

  if (slides[indiceAnterior]) slides[indiceAnterior].classList.remove("active");
  if (indicadores[indiceAnterior])
    indicadores[indiceAnterior].classList.remove("active");

  carrusel.slideActual =
    ((nuevoIndice % carrusel.totalSlides) + carrusel.totalSlides) %
    carrusel.totalSlides;

  if (slides[carrusel.slideActual])
    slides[carrusel.slideActual].classList.add("active");
  if (indicadores[carrusel.slideActual])
    indicadores[carrusel.slideActual].classList.add("active");
  if (contadorActual) contadorActual.textContent = carrusel.slideActual + 1;
}

// Función para inicializar carrusel específico de una publicación
function inicializarCarruselPublicacion(
  publicacionId,
  totalImagenes,
  referencia = null,
) {
  const estado = obtenerCarruselPublicacion(publicacionId, referencia);

  if (!estado) return;

  carruselesPublicaciones.set(estado.publicacion, {
    slideActual: 0,
    totalSlides: totalImagenes || estado.slides.length || 0,
  });

  if (estado) {
    actualizarCarruselPublicacion(publicacionId, 0, estado.publicacion);
  }
}

// Función para cambiar slide en una publicación específica
function cambiarSlidePublicacion(publicacionId, direccion, referencia = null) {
  const estado = obtenerCarruselPublicacion(publicacionId, referencia);
  if (!estado) return;

  actualizarCarruselPublicacion(
    publicacionId,
    estado.carrusel.slideActual + direccion,
    estado.publicacion,
  );
}

// Función para ir a un slide específico en una publicación
function irSlidePublicacion(publicacionId, index, referencia = null) {
  const estado = obtenerCarruselPublicacion(publicacionId, referencia);
  if (!estado) return;

  actualizarCarruselPublicacion(publicacionId, index, estado.publicacion);
}

// Función para inicializar contadores de comentarios en publicaciones existentes
function inicializarContadoresComentarios() {
  // Actualizar contadores para todas las publicaciones que tienen comentarios
  const comentarios = comentariosPorPublicacion || {};
  Object.keys(comentarios).forEach((publicacionId) => {
    actualizarContadorComentarios(publicacionId);
  });
}

// ==================== FunciónONES DE COMENTARIOS ====================

// Constante para el almacenamiento de comentarios
const COMENTARIOS_STORAGE_KEY = "gnet_comentarios";

// Función para cargar comentarios desde localStorage
function cargarComentariosDelStorage() {
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
  comentariosPorPublicacion = cargarComentariosDelStorage();
  console.log("💬 Comentarios inicializados:", comentariosPorPublicacion);
}

// Función para alternar la visibilidad de los comentarios
async function toggleComentarios(publicacionId, publicacionRef = null) {
  const publicacion = obtenerPublicacionElemento(publicacionId, publicacionRef);
  if (!publicacion) {
    console.warn("Publicación no encontrada para comentarios:", publicacionId);
    return;
  }

  const domPublicacionId = publicacion.id || String(publicacionId);
  const backendPublicationId = Number(
    publicacion.dataset.publicationId ||
      publicacion.dataset.pubid ||
      publicacionId,
  );
  const seccionComentarios = publicacion.querySelector(
    `#comentarios-${domPublicacionId}`,
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

    const textarea = seccionComentarios.querySelector(".campo-comentario");
    if (textarea && !textarea.hasAttribute("data-configured")) {
      textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 100) + "px";
      });
      textarea.setAttribute("data-configured", "true");
    }

    if (!comentariosPorPublicacion) {
      console.warn(
        "⚠️ comentariosPorPublicacion no estaba inicializada, reinicializando...",
      );
      comentariosPorPublicacion = cargarComentariosDelStorage();
    }

    // Si está conectado al backend, cargar comentarios desde allá
    const claveComentarios =
      Number.isInteger(backendPublicationId) && backendPublicationId > 0
        ? String(backendPublicationId)
        : obtenerClaveComentariosPublicacion(domPublicacionId);

    if (backendConectado && usarBackend) {
      if (
        !Number.isInteger(backendPublicationId) ||
        backendPublicationId <= 0
      ) {
        console.error(
          "❌ publicationId inválido en toggleComentarios:",
          publicacionId,
        );
      } else {
        const backendComments =
          await obtenerComentariosBackend(backendPublicationId);

        // Protección adicional: asegurar que comentariosPorPublicacion esté inicializado
        if (
          !comentariosPorPublicacion ||
          typeof comentariosPorPublicacion !== "object"
        ) {
          console.warn(
            "⚠️ comentariosPorPublicacion no es un objeto válido, reinicializando...",
          );
          comentariosPorPublicacion = {};
        }

        console.log(
          "📥 Comentarios del backend recibidos:",
          backendComments.length,
          "para",
          backendPublicationId,
        );

        comentariosPorPublicacion[claveComentarios] = backendComments
          .map((c) => {
            const comentarioNormalizado =
              c?.backendId !== undefined ? c : normalizarComentarioBackend(c);

            if (!comentarioNormalizado) return null;

            return {
              id: comentarioNormalizado.id,
              backendId: comentarioNormalizado.backendId,
              userId: comentarioNormalizado.userId,
              username: comentarioNormalizado.username,
              texto: comentarioNormalizado.contenido,
              autor:
                comentarioNormalizado.nombre ||
                comentarioNormalizado.username ||
                "Usuario",
              handle: comentarioNormalizado.handle,
              avatar: comentarioNormalizado.avatar,
              fecha: comentarioNormalizado.fechaCreacion
                ? new Date(comentarioNormalizado.fechaCreacion)
                : new Date(),
              likes: comentarioNormalizado.likes ?? 0,
              liked: comentarioNormalizado.liked ?? false,
            };
          })
          .filter((comentario) => comentario !== null);

        console.log(
          "✅ Comentarios asignados a comentariosPorPublicacion[" +
            claveComentarios +
            "]",
        );
        guardarComentarios();
      }
    }

    renderizarComentarios(domPublicacionId, publicacion);
    actualizarContadorComentarios(domPublicacionId, publicacion);
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
  renderizarComentarios(publicacionId);
}

// Función para publicar un comentario
async function publicarComentario(publicacionId) {
  console.log("🎯 Iniciando publicarComentario para:", publicacionId);

  // Verificar que la variable esté inicializada
  if (!comentariosPorPublicacion) {
    console.error("❌ comentariosPorPublicacion no está inicializada");
    comentariosPorPublicacion = {};
  }

  const publicacion = obtenerPublicacionElemento(publicacionId);
  if (!publicacion) {
    console.error("❌ Publicación no encontrada para comentar:", publicacionId);
    return;
  }

  const domPublicacionId = publicacion.id || String(publicacionId);
  const backendPublicationId = Number(
    publicacion.dataset.publicationId ||
      publicacion.dataset.pubid ||
      publicacionId,
  );
  const campoComentario = publicacion.querySelector(
    `#campo-comentario-${domPublicacionId}`,
  );
  if (!campoComentario) {
    console.error(
      "❌ Campo de comentario no encontrado:",
      `campo-comentario-${domPublicacionId}`,
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

  let comentarioBackend = null;
  const claveComentarios =
    Number.isInteger(backendPublicationId) && backendPublicationId > 0
      ? String(backendPublicationId)
      : obtenerClaveComentariosPublicacion(domPublicacionId);

  // Si el backend está conectado, enviar comentario al backend
  if (backendConectado && usarBackend) {
    if (!Number.isInteger(backendPublicationId) || backendPublicationId <= 0) {
      console.error("❌ publicationId inválido para comentar:", publicacionId);
      return;
    }

    comentarioBackend = await agregarComentarioBackend(
      backendPublicationId,
      textoComentario,
    );
    if (!comentarioBackend) {
      console.warn("⚠️ No se pudo guardar el comentario en backend");
    }
  }

  // Obtener datos del usuario actual
  const datosUsuario = obtenerDatosUsuario();

  // Crear objeto de comentario
  const nuevoComentario = comentarioBackend
    ? {
        id: comentarioBackend.id,
        backendId: comentarioBackend.backendId,
        userId: comentarioBackend.userId,
        username: comentarioBackend.username,
        texto: comentarioBackend.contenido,
        autor:
          comentarioBackend.nombre || comentarioBackend.username || "Usuario",
        handle: comentarioBackend.handle,
        avatar: comentarioBackend.avatar,
        fecha: comentarioBackend.fechaCreacion
          ? new Date(comentarioBackend.fechaCreacion)
          : new Date(),
        likes: comentarioBackend.likes ?? 0,
        liked: comentarioBackend.liked ?? false,
      }
    : {
        id: "comment_" + Date.now(),
        texto: textoComentario,
        autor: datosUsuario.username,
        handle: datosUsuario.handle,
        avatar: datosUsuario.avatar,
        fecha: new Date(),
        likes: 0,
        liked: false,
      };

  // Agregar comentario al storage local
  if (!comentariosPorPublicacion[claveComentarios]) {
    comentariosPorPublicacion[claveComentarios] = [];
  }
  comentariosPorPublicacion[claveComentarios].unshift(nuevoComentario);

  // Guardar comentarios en localStorage
  guardarComentarios();

  // Limpiar campo
  campoComentario.value = "";
  campoComentario.style.height = "auto";

  // Asegurar que la sección de comentarios esté visible
  const seccionComentarios = publicacion.querySelector(
    `#comentarios-${domPublicacionId}`,
  );
  if (seccionComentarios && seccionComentarios.style.display === "none") {
    seccionComentarios.style.display = "block";
    console.log("🔓 Sección de comentarios abierta automáticamente");
  }

  // Actualizar contador en el botón
  actualizarContadorComentarios(domPublicacionId, publicacion);

  // Recargar comentarios en la UI
  renderizarComentarios(domPublicacionId, publicacion);

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
    const claveComentarios = obtenerClaveComentariosPublicacion(publicacionId);
    if (comentariosPorPublicacion[claveComentarios]) {
      datosPublicacion.comentarios = [
        ...comentariosPorPublicacion[claveComentarios],
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
function renderizarComentarios(publicacionId, publicacionRef = null) {
  console.log("🔄 Cargando comentarios para:", publicacionId);

  // Protección: inicializar si es undefined
  if (!comentariosPorPublicacion) {
    console.warn(
      "⚠️ comentariosPorPublicacion undefined en renderizarComentarios, inicializando...",
    );
    comentariosPorPublicacion = cargarComentariosDelStorage();
  }

  const publicacion = obtenerPublicacionElemento(publicacionId, publicacionRef);
  if (!publicacion) {
    console.error("❌ Publicación no encontrada para:", publicacionId);
    return;
  }

  const domPublicacionId = publicacion.id || String(publicacionId);
  const listaComentarios = publicacion.querySelector(
    `#lista-comentarios-${domPublicacionId}`,
  );
  const contadorComentarios = publicacion.querySelector(
    `#count-${domPublicacionId}`,
  );

  console.log("🎯 Elementos encontrados:", {
    listaComentarios: listaComentarios ? "Sí" : "NO",
    contadorComentarios: contadorComentarios ? "Sí" : "NO",
  });

  if (!listaComentarios || !contadorComentarios) {
    console.error("❌ Elementos no encontrados para:", publicacionId);
    return;
  }

  const claveComentarios = obtenerClaveComentariosPublicacion(domPublicacionId);
  const comentarios = comentariosPorPublicacion[claveComentarios] || [];
  console.log("📊 Comentarios a mostrar:", comentarios.length);

  contadorComentarios.textContent = comentarios.length;

  if (comentarios.length === 0) {
    listaComentarios.innerHTML =
      '<div class="sin-comentarios">Sé el primero en comentar</div>';
    return;
  }

  // Generar HTML de comentarios
  const datosUsuario = obtenerDatosUsuario();

  listaComentarios.innerHTML = comentarios
    .map((comentario) => {
      const esComentarioPropio = puedeEliminarComentario(
        comentario,
        datosUsuario,
      );

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
                                <button class="menu-opcion eliminar" onclick="eliminarComentario('${domPublicacionId}', '${comentario.id}')">
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
                  <button class="accion-comentario" onclick="responderComentario('${domPublicacionId}', '${comentario.id}', this)">
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
  const comentarios =
    comentariosPorPublicacion[
      obtenerClaveComentariosPublicacion(publicacionId)
    ];
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
  renderizarComentarios(publicacionId);
}

// Función para responder a un comentario
function responderComentario(publicacionId, comentarioId, referencia = null) {
  const publicacion = obtenerPublicacionElemento(publicacionId, referencia);
  if (!publicacion) return;

  const domPublicacionId = publicacion.id || String(publicacionId);
  const campoComentario = publicacion.querySelector(
    `#campo-comentario-${domPublicacionId}`,
  );
  const comentarios =
    comentariosPorPublicacion[
      obtenerClaveComentariosPublicacion(domPublicacionId)
    ];

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
function actualizarContadorComentarios(publicacionId, publicacionRef = null) {
  const publicacion = obtenerPublicacionElemento(publicacionId, publicacionRef);
  if (!publicacion) return;

  const domPublicacionId = publicacion.id || String(publicacionId);
  const botonComentarios = publicacion.querySelector(".comentarios");

  if (!botonComentarios) return;

  const contador = botonComentarios.querySelector("span");
  const numeroComentarios = (
    comentariosPorPublicacion[
      obtenerClaveComentariosPublicacion(domPublicacionId)
    ] || []
  ).length;

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

// Función para eliminar comentario
async function eliminarComentario(publicacionId, comentarioId) {
  const publicacion = obtenerPublicacionElemento(publicacionId);
  const domPublicacionId = publicacion?.id || String(publicacionId);
  const claveComentarios = obtenerClaveComentariosPublicacion(domPublicacionId);
  const comentarios = comentariosPorPublicacion[claveComentarios];
  if (!comentarios) return;

  const comentario = comentarios.find((c) => {
    const idComentario = extraerIdNumerico(c.backendId || c.id || c.commentId);
    const idClick = extraerIdNumerico(comentarioId);
    return (
      c.id === comentarioId ||
      String(c.backendId) === String(comentarioId) ||
      (idClick && idComentario === idClick)
    );
  });
  if (!comentario) return;

  // Si está conectado al backend y el comentario existe allá, eliminar allá
  if (
    backendConectado &&
    usarBackend &&
    (comentario.backendId ||
      String(comentarioId).startsWith("comment_backend_"))
  ) {
    const eliminadoBackend = await eliminarComentarioBackend(
      comentario.backendId || comentarioId,
    );

    if (!eliminadoBackend) {
      mostrarNotificacion("No se pudo eliminar el comentario", "error");
      return;
    }
  }

  // Animar eliminación inmediatamente
  const elementoComentario = (publicacion || document).querySelector(
    `#${comentarioId}`,
  );
  if (elementoComentario) {
    elementoComentario.style.transition = "all 0.3s ease";
    elementoComentario.style.opacity = "0";
    elementoComentario.style.transform = "translateX(-20px)";

    setTimeout(() => {
      const index = comentarios.findIndex((c) => c.id === comentario.id);
      if (index !== -1) {
        comentarios.splice(index, 1);
        comentariosPorPublicacion[claveComentarios] = comentarios;
        guardarComentarios();
        actualizarContadorComentarios(domPublicacionId, publicacion);
        renderizarComentarios(domPublicacionId, publicacion);
      }
    }, 300);
  }

  document
    .querySelectorAll(".menu-dropdown.activo")
    .forEach((m) => m.classList.remove("activo"));
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
function toggleMenuPublicacion(publicacionId, publicacionRef = null) {
  const publicacion = obtenerPublicacionElemento(publicacionId, publicacionRef);
  if (!publicacion) return;

  const domPublicacionId = publicacion.id || String(publicacionId);

  // Cerrar otros menús abiertos
  const otrosMenus = document.querySelectorAll(
    ".menu-dropdown-publicacion.activo",
  );
  otrosMenus.forEach((menu) => {
    if (menu.id !== `menu-pub-${domPublicacionId}`) {
      menu.classList.remove("activo");
    }
  });

  // Alternar el menú actual
  const menu = publicacion.querySelector(`#menu-pub-${domPublicacionId}`);
  if (menu) {
    menu.classList.toggle("activo");
  }
}

async function eliminarPublicacionPerfil(
  publicationId,
  domId,
  publicacionRef = null,
) {
  const userId = getUserIdForApi();
  const realPublicationId =
    obtenerIdPublicacionReal(publicationId) ||
    obtenerIdPublicacionReal(domId) ||
    Number(publicationId);

  if (!userId || !realPublicationId) {
    console.error("IDs inválidos para eliminar publicación:", {
      userId,
      realPublicationId,
    });
    return false;
  }

  const response = await fetchConAutenticacion(
    `${API_ENDPOINTS.publication}/${realPublicationId}/user/${userId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error(
      "Error eliminando publicación:",
      response ? response.status : "sin respuesta",
      errorText,
    );
    return false;
  }

  const card =
    obtenerPublicacionElemento(
      domId || `pub_${realPublicationId}`,
      publicacionRef,
    ) ||
    document.querySelector(
      `.publicacion[data-publication-id="${realPublicationId}"]`,
    );
  if (card) {
    const wrapper = card.closest(".contenedor-publicacion") || card;
    wrapper.remove();
  }

  return true;
}

// Función para eliminar publicación
function eliminarPublicacion(publicacionId, triggerRef = null) {
  const elementoPublicacion = obtenerPublicacionElemento(
    publicacionId,
    triggerRef,
  );
  if (!elementoPublicacion) return;

  const realPubId = Number(
    elementoPublicacion.dataset.publicationId ||
      elementoPublicacion.dataset.pubid ||
      publicacionId,
  );

  // Eliminar del backend si está conectado
  if (
    backendConectado &&
    usarBackend &&
    Number.isInteger(realPubId) &&
    realPubId > 0
  ) {
    eliminarPublicacionBackend(realPubId);
  }

  // Animar eliminación
  elementoPublicacion.style.transition = "all 0.4s ease";
  elementoPublicacion.style.opacity = "0";
  elementoPublicacion.style.transform = "translateX(-30px) scale(0.95)";

  setTimeout(() => {
    const contenedorPublicacion = elementoPublicacion.closest(
      ".contenedor-publicacion",
    );
    if (contenedorPublicacion) contenedorPublicacion.remove();
    else elementoPublicacion.remove();
  }, 400);

  document
    .querySelectorAll(".menu-dropdown-publicacion.activo")
    .forEach((m) => m.classList.remove("activo"));
}

// Función para alternar me gusta (like) en una publicación
async function alternarMeGusta(botonElement, publicacionId) {
  try {
    const spanContador = botonElement.querySelector("span");
    const svgElement = botonElement.querySelector("svg");
    let conteoAnterior = parseInt(spanContador.textContent) || 0;

    const elementoPublicacion = obtenerPublicacionElemento(
      publicacionId,
      botonElement,
    );
    const domPublicacionId = elementoPublicacion?.id || String(publicacionId);
    const numericPublicacionId = Number(
      elementoPublicacion?.dataset?.publicationId ||
        elementoPublicacion?.dataset?.pubid ||
        publicacionId,
    );

    console.log(
      `🔗 Toggling like - publicacionId: ${publicacionId}, numeric: ${numericPublicacionId}`,
    );

    if (!Number.isInteger(numericPublicacionId) || numericPublicacionId <= 0) {
      console.error("❌ publicacionId inválido:", publicacionId);
      mostrarNotificacion("Error: publicación no válida", "error");
      return;
    }

    if (backendConectado && usarBackend) {
      // Verificar si el usuario ya dio like
      const yaLeDioLike = await verificarLikeBackend(numericPublicacionId);

      if (yaLeDioLike) {
        // Quitar like
        const exito = await quitarLikeBackend(numericPublicacionId);
        if (exito) {
          botonElement.classList.remove("liked");
          svgElement.setAttribute("fill", "none");
          console.log(`✅ Like removed successfully from ${publicacionId}`);
        } else {
          console.warn("No se pudo quitar like en backend");
          mostrarNotificacion("Error al quitar el like", "error");
          return;
        }
      } else {
        // Dar like
        const exito = await darLikeBackend(numericPublicacionId);
        if (exito) {
          botonElement.classList.add("liked");
          svgElement.setAttribute("fill", "currentColor");
          console.log(`✅ Like added successfully to ${publicacionId}`);
        } else {
          console.warn("No se pudo dar like en backend");
          mostrarNotificacion("Error al dar el like", "error");
          return;
        }
      }

      // Obtener el contador actualizado desde el backend
      const nuevoConteo =
        await obtenerCantidadLikesBackend(numericPublicacionId);
      spanContador.textContent = nuevoConteo;

      console.log(
        `✅ Like toggled. Nueva cantidad: ${nuevoConteo}, Usuario tenía like: ${yaLeDioLike}`,
      );
    } else {
      // Usar localStorage (Funcionalidad local sin backend)
      const datosUsuario = obtenerDatosUsuario();
      const claveUsuario = datosUsuario.handle;

      // Cargar likes del usuario actual
      const likesLocales = JSON.parse(
        localStorage.getItem("gnet_likes") || "{}",
      );
      const likesUsuario = likesLocales[claveUsuario] || {};
      const claveLocal = domPublicacionId;

      // Verificar si el usuario ya dio like a esta publicación
      const yaLeDioLike = likesUsuario[claveLocal] === true;

      // Cargar contadores globales
      const contadoresGlobales = JSON.parse(
        localStorage.getItem("gnet_contadores_likes") || "{}",
      );
      let nuevoConteo = contadoresGlobales[claveLocal] || conteoAnterior;

      if (yaLeDioLike) {
        // Quitar like
        delete likesUsuario[claveLocal];
        nuevoConteo = Math.max(0, nuevoConteo - 1);
        botonElement.classList.remove("liked");
        svgElement.setAttribute("fill", "none");
        console.log(`👎 Like removed. Nuevo contador: ${nuevoConteo}`);
      } else {
        // Dar like
        likesUsuario[claveLocal] = true;
        nuevoConteo++;
        botonElement.classList.add("liked");
        svgElement.setAttribute("fill", "currentColor");
        console.log(`👍 Like added. Nuevo contador: ${nuevoConteo}`);
      }

      // Guardar cambios
      likesLocales[claveUsuario] = likesUsuario;
      contadoresGlobales[claveLocal] = nuevoConteo;
      localStorage.setItem("gnet_likes", JSON.stringify(likesLocales));
      localStorage.setItem(
        "gnet_contadores_likes",
        JSON.stringify(contadoresGlobales),
      );

      // Actualizar UI
      spanContador.textContent = nuevoConteo;
    }

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
  const comentarios = comentariosPorPublicacion || {};
  Object.keys(comentarios).forEach((publicacionId) => {
    actualizarContadorComentarios(publicacionId);
  });
}

// Alias para compatibilidad con las publicaciones dinámicas
async function alternarComentarios(publicacionId, publicacionRef = null) {
  const id = Number(publicacionId);

  if (!Number.isInteger(id) || id <= 0) {
    console.error(
      "❌ publicationId inválido en alternarComentarios:",
      publicacionId,
    );
    return;
  }

  await toggleComentarios(id, publicacionRef);
}

// Función auxiliar para establecer el estado visual de un botón de like
function setearEstadoLikeBoton(botonElement, tieneLike, contador) {
  const svgElement = botonElement?.querySelector("svg");
  const spanContador = botonElement?.querySelector("span");

  if (!botonElement || !svgElement || !spanContador) {
    console.warn("⚠️ Elementos del botón de like no encontrados");
    return;
  }

  if (tieneLike) {
    botonElement.classList.add("liked");
    svgElement.setAttribute("fill", "currentColor");
    console.log(`❤️ Like button marked as liked`);
  } else {
    botonElement.classList.remove("liked");
    svgElement.setAttribute("fill", "none");
    console.log(`🤍 Like button marked as not liked`);
  }

  spanContador.textContent = contador || 0;
}

// Función para inicializar estados de likes desde localStorage o backend
async function inicializarLikesPublicaciones() {
  const datosUsuario = obtenerDatosUsuario();
  const claveUsuario = datosUsuario.handle;

  console.log("🔍 Inicializando likes para usuario:", claveUsuario);

  // Cargar likes del usuario actual (para fallback offline)
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

  todasLasPublicaciones.forEach(async (publicacion) => {
    const publicacionId = publicacion.id;
    const backendPublicationId = Number(
      publicacion.dataset.publicationId ||
        publicacion.dataset.pubid ||
        publicacionId,
    );
    const botonLike = publicacion.querySelector(".me-gusta");
    const svgElement = botonLike?.querySelector("svg");
    const spanContador = botonLike?.querySelector("span");

    if (botonLike && svgElement && spanContador) {
      let usuarioYaDioLike = false;
      let contador = parseInt(spanContador.textContent) || 0;

      if (backendConectado && usarBackend) {
        // Verificar en el backend
        try {
          if (
            Number.isInteger(backendPublicationId) &&
            backendPublicationId > 0
          ) {
            usuarioYaDioLike = await verificarLikeBackend(backendPublicationId);
            contador = await obtenerCantidadLikesBackend(backendPublicationId);
          } else {
            usuarioYaDioLike = likesUsuario[publicacionId] === true;
            contador =
              contadoresGlobales[publicacionId] ||
              parseInt(spanContador.textContent) ||
              0;
          }
          console.log(
            `✅ Datos de backend obtenidos para ${publicacionId}: like=${usuarioYaDioLike}, contador=${contador}`,
          );
        } catch (error) {
          console.warn(
            `⚠️ Error obteniendo likes del backend para ${publicacionId}, usando localStorage`,
            error,
          );
          usuarioYaDioLike = likesUsuario[publicacionId] === true;
          contador =
            contadoresGlobales[publicacionId] ||
            parseInt(spanContador.textContent) ||
            0;
        }
      } else {
        // Usar localStorage (modo offline)
        usuarioYaDioLike = likesUsuario[publicacionId] === true;
        contador =
          contadoresGlobales[publicacionId] ||
          parseInt(spanContador.textContent) ||
          0;
      }

      console.log(
        `👤 Publicación ${publicacionId}: Usuario ya dio like = ${usuarioYaDioLike}`,
      );

      // Actualizar estado visual usando función auxiliar
      setearEstadoLikeBoton(botonLike, usuarioYaDioLike, contador);
    }
  });

  console.log("👍 Likes inicializados para usuario:", claveUsuario);
}

// Función para inicializar like de una publicación específica
async function inicializarLikePublicacion(
  publicacionId,
  publicacionRef = null,
) {
  const publicacion = obtenerPublicacionElemento(publicacionId, publicacionRef);
  if (!publicacion) return;
  const domPublicacionId = publicacion.id || String(publicacionId);
  const backendPublicationId = Number(
    publicacion.dataset.publicationId ||
      publicacion.dataset.pubid ||
      publicacionId,
  );

  const botonLike = publicacion.querySelector(".me-gusta");
  const svgElement = botonLike?.querySelector("svg");
  const spanContador = botonLike?.querySelector("span");
  if (!botonLike || !svgElement || !spanContador) return;

  let usuarioYaDioLike = false;
  let contador = parseInt(spanContador.textContent) || 0;

  if (backendConectado && usarBackend) {
    try {
      if (Number.isInteger(backendPublicationId) && backendPublicationId > 0) {
        usuarioYaDioLike = await verificarLikeBackend(backendPublicationId);
        contador = await obtenerCantidadLikesBackend(backendPublicationId);
      } else {
        usuarioYaDioLike = obtenerLikeLocal(domPublicacionId);
        contador = obtenerContadorLocal(domPublicacionId) || contador;
      }
    } catch (error) {
      console.warn(
        `⚠️ Error obteniendo likes del backend para ${publicacionId}, usando localStorage`,
        error,
      );
      usuarioYaDioLike = obtenerLikeLocal(domPublicacionId);
      contador = obtenerContadorLocal(domPublicacionId) || contador;
    }
  } else {
    usuarioYaDioLike = obtenerLikeLocal(domPublicacionId);
    contador = obtenerContadorLocal(domPublicacionId) || contador;
  }

  setearEstadoLikeBoton(botonLike, usuarioYaDioLike, contador);
}

function obtenerLikeLocal(publicacionId) {
  const datosUsuario = obtenerDatosUsuario();
  const likesLocales = JSON.parse(localStorage.getItem("gnet_likes") || "{}");
  const likesUsuario = likesLocales[datosUsuario.handle] || {};
  return likesUsuario[publicacionId] === true;
}

function obtenerContadorLocal(publicacionId) {
  const contadoresGlobales = JSON.parse(
    localStorage.getItem("gnet_contadores_likes") || "{}",
  );
  return contadoresGlobales[publicacionId] || 0;
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
  // Cargar el modo guardado al iniciar
  cargarModoGuardado();

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
    comentariosPorPublicacion = renderizarComentarios();
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
async function procesarNuevaFotoPerfil(event) {
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

  const fotoPerfilPreview = document.getElementById("foto-perfil-preview");
  const avatarAnterior = normalizarAvatar(
    fotoPerfilPreview?.src || obtenerDatosUsuario().avatar,
  );
  const vistaTemporal = URL.createObjectURL(archivo);

  if (fotoPerfilPreview) {
    fotoPerfilPreview.src = vistaTemporal;
  }

  actualizarFotosPerfilEnPagina(vistaTemporal);

  try {
    const userId = getUserIdForApi();
    if (!userId) {
      throw new Error("No se pudo obtener el ID del usuario");
    }

    const usuarioActualizado = await actualizarFotoPerfil(userId, archivo);
    const fotoServidor = normalizarAvatar(
      usuarioActualizado?.profilePhoto || vistaTemporal,
    );

    if (fotoPerfilPreview) {
      fotoPerfilPreview.src = fotoServidor;
    }

    actualizarFotosPerfilEnPagina(fotoServidor);
    guardarNuevaFotoPerfil(fotoServidor);

    mostrarAlertaExito("¡éxito!", "Foto de perfil actualizada correctamente");
  } catch (error) {
    if (fotoPerfilPreview) {
      fotoPerfilPreview.src = avatarAnterior;
    }
    actualizarFotosPerfilEnPagina(avatarAnterior);
    console.error("Error actualizando foto de perfil:", error);
    mostrarAlertaError("Error", "No se pudo actualizar la foto de perfil");
  } finally {
    URL.revokeObjectURL(vistaTemporal);
  }
}

// Función para actualizar todas las fotos de perfil en la página
function actualizarFotosPerfilEnPagina(nuevaImagenUrl) {
  // Actualizar foto en el sidebar
  const avatarSidebar = document.querySelector(".mi-perfil .avatar img");
  if (avatarSidebar) {
    avatarSidebar.src = nuevaImagenUrl;
  }

  const fotoPerfilPrincipal = document.querySelector(".foto-perfil");
  if (fotoPerfilPrincipal) {
    fotoPerfilPrincipal.src = nuevaImagenUrl;
  }

  // Actualizar foto en el compositor de publicaciones
  const avatarPublicar = document.querySelector(".usuario-header .avatar img");
  if (avatarPublicar) {
    avatarPublicar.src = nuevaImagenUrl;
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
    datosUsuario.seguidores,
    datosUsuario.seguidos,
    datosUsuario.bio,
  );

  // Los datos se sincronizarán automáticamente con el backend
}

// Función para cargar foto de perfil al iniciar
function cargarFotoPerfilInicial() {
  const datosUsuario = obtenerDatosUsuario();
  const avatarInicial = normalizarAvatar(datosUsuario.avatar);

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

  actualizarContadoresPerfil(datosUsuario.seguidores, datosUsuario.seguidos);
}

// Event listeners para la Funciónonalidad de perfil
document.addEventListener("DOMContentLoaded", function () {
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
});

window.addEventListener("gnet:user-loaded", function () {
  cargarFotoPerfilInicial();
  cargarDatosPerfilEnInputs();
  inicializarPerfilDesdeBackend();
  cargarSugerenciasUsuarios().catch((error) => {
    console.error("Error cargando sugerencias:", error);
  });
  recargarSistemaFollow().catch((error) => {
    console.error("Error cargando follows:", error);
  });
});

window.addEventListener("gnet:user-updated", function (event) {
  if (event.detail) {
    actualizarPerfilEnPantalla(event.detail);
    cargarDatosPerfilEnInputs();
    recargarSistemaFollow().catch((error) => {
      console.error("Error actualizando follows:", error);
    });
  }
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
async function guardarCambiosPerfil() {
  const inputUsername = document.getElementById("input-username");
  const inputHandle = document.getElementById("input-handle");
  const fotoPerfilPreview = document.getElementById("foto-perfil-preview");

  // Validar datos
  const nuevoUsername = inputUsername.value.trim();
  const nuevoHandle = inputHandle.value.trim();

  if (!nuevoUsername) {
    mostrarAlertaError("Error", "El nombre de usuario no puede estar vacío");
    return;
  }

  if (!nuevoHandle) {
    mostrarAlertaError("Error", "El handle no puede estar vacío");
    return;
  }

  const datosActuales = obtenerDatosUsuario();
  const avatarActual = normalizarAvatar(
    fotoPerfilPreview?.src || datosActuales.avatar,
  );

  const perfilServidor = await actualizarPerfilBackend(
    nuevoUsername,
    nuevoHandle,
  );

  if (!perfilServidor) {
    mostrarAlertaError("Error", "No se pudieron guardar los cambios");
    return;
  }

  const nombreGuardado = normalizarTexto(perfilServidor.name, nuevoUsername);
  const handleGuardado = normalizarHandle(
    perfilServidor.username || nuevoHandle,
    nuevoUsername,
  );
  const avatarGuardado = normalizarAvatar(
    perfilServidor.profilePhoto || perfilServidor.avatar || avatarActual,
  );

  // Guardar nuevos datos
  const exito = guardarDatosUsuarioLocales(
    nombreGuardado,
    handleGuardado,
    avatarGuardado,
    datosActuales.seguidores,
    datosActuales.seguidos,
    datosActuales.bio,
  );

  if (exito) {
    // Actualizar toda la interfaz
    actualizarInterfazConNuevosDatos(
      nombreGuardado,
      handleGuardado,
      avatarGuardado,
      datosActuales.seguidores,
      datosActuales.seguidos,
    );

    // Actualizar handle en el input
    inputUsername.value = nombreGuardado;
    inputHandle.value = handleGuardado.replace("@", "");
    if (fotoPerfilPreview) {
      fotoPerfilPreview.src = avatarGuardado;
    }

    mostrarAlertaExito("¡éxito!", "Perfil actualizado correctamente");

    setTimeout(() => {
      window.location.reload();
    }, 900);
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
function actualizarInterfazConNuevosDatos(
  username,
  handle,
  avatar,
  seguidores = 0,
  seguidos = 0,
) {
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

  actualizarContadoresPerfil(seguidores, seguidos);

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
      renderizarComentarios(publicacionId);
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
  if (!fechaISO) return "ahora";

  const fechaPublicacion = new Date(fechaISO);
  if (Number.isNaN(fechaPublicacion.getTime())) return "ahora";

  const ahora = new Date();
  const diferenciaMs = ahora - fechaPublicacion;
  const segundos = Math.floor(diferenciaMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  if (horas < 24) return `hace ${horas} h`;
  if (dias < 7) return `hace ${dias} d`;

  return fechaPublicacion.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

if (typeof window !== "undefined") {
  window.cargarPublicacionesMiPerfil = cargarPublicacionesMiPerfil;
  window.eliminarPublicacionPerfil = eliminarPublicacionPerfil;
  window.toggleMenuPublicacion = toggleMenuPublicacion;
  window.eliminarPublicacion = eliminarPublicacion;
  window.alternarComentarios = alternarComentarios;
  window.toggleComentarios = toggleComentarios;
  window.publicarComentario = publicarComentario;
  window.renderizarComentarios = renderizarComentarios;
  window.actualizarContadorComentarios = actualizarContadorComentarios;
  window.eliminarComentario = eliminarComentario;
  window.toggleMenuComentario = toggleMenuComentario;
  window.alternarMeGusta = alternarMeGusta;
  window.abrirSelectorImagenes = abrirSelectorImagenes;
  window.abrirSelectorVideos = abrirSelectorVideos;
  window.limpiarImagenes = limpiarImagenes;
  window.verificarEnter = verificarEnter;
  window.publicarContenido = publicarContenido;
  window.abrirCreadorEncuesta = abrirCreadorEncuesta;
  window.cerrarCreadorEncuesta = cerrarCreadorEncuesta;
  window.AgregarOpcion = AgregarOpcion;
  window.eliminarOpcion = eliminarOpcion;
  window.eliminarEncuestaPendiente = eliminarEncuestaPendiente;
  window.eliminarImagenPorElemento = eliminarImagenPorElemento;
}
