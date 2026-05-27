/**
 * Script de autenticación para HomeNew
 *
 * @author Kevin Pineda
 * @license KevinPineda
 * @copyright © 2025 Kevin Pineda. Todos los derechos reservados.
 */

let currentUser = null;

const API_BASE_URL = "/api-backend";

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const base64 = normalized + (padding ? "=".repeat(4 - padding) : "");

  try {
    return atob(base64);
  } catch (error) {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payload = decodeBase64Url(parts[1]);
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function getTokenFromStorageOrCookie() {
  try {
    const stored = localStorage.getItem("token");
    if (stored) return stored;
  } catch (e) {}

  const match = document.cookie.match(new RegExp("(^| )jwt=([^;]+)"));
  if (match) return match[2];
  return null;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getStoredToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      getCookie("jwt")
    );
  } catch (error) {
    return getCookie("jwt");
  }
}

function getStoredUserId() {
  const candidates = [];

  try {
    candidates.push(localStorage.getItem("userId"));
  } catch (error) {}

  if (currentUser) {
    candidates.push(
      currentUser.id,
      currentUser.userId,
      currentUser.usuarioId,
      currentUser.credentialId,
      currentUser.idUser,
    );
  }

  try {
    candidates.push(localStorage.getItem("credentialId"));
  } catch (error) {}

  const token = getStoredToken() || getTokenFromStorageOrCookie();
  const payload = decodeJwtPayload(token);
  if (payload) {
    candidates.push(
      payload.id,
      payload.userId,
      payload.usuarioId,
      payload.credentialId,
      payload.sub,
    );
  }

  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return null;
}

function normalizarUsuarioBackend(usuario) {
  if (!usuario) {
    return null;
  }

  if (typeof usuario !== "object") {
    const nombreVisible = String(usuario);
    return {
      id: null,
      userId: null,
      user: nombreVisible,
      username: nombreVisible,
      name: nombreVisible,
      handle: `@${nombreVisible.toLowerCase().replace(/\s+/g, "")}`,
      avatar: null,
      profileImage: null,
      profilePhoto: null,
      seguidores: 0,
      seguidos: 0,
      bio: "",
    };
  }

  // Normalizar campos del usuario desde diferentes formatos de respuesta del backend
  const profilePhoto =
    usuario.profileImage || usuario.profilePhoto || usuario.avatar;
  const username =
    usuario.username || usuario.nombreUsuario || usuario.userName || "";
  const rol =
    usuario.rol ||
    usuario.role ||
    usuario.credential?.rol ||
    usuario.credential?.role ||
    "";
  const nombreVisible =
    usuario.user || usuario.name || usuario.nombre || username || "Usuario";

  return {
    ...usuario,
    id:
      usuario.id ??
      usuario.userId ??
      usuario.usuarioId ??
      usuario.idUser ??
      null,
    userId:
      usuario.userId ??
      usuario.id ??
      usuario.usuarioId ??
      usuario.idUser ??
      null,
    user: nombreVisible,
    username: username || nombreVisible,
    name: nombreVisible,
    rol,
    role: rol,
    handle:
      usuario.handle ||
      `@${(username || nombreVisible || "usuario").toLowerCase().replace(/\s+/g, "")}`,
    // Usar 'avatar' como campo principal para compatibilidad con inicio.js
    avatar: profilePhoto,
    profileImage: profilePhoto,
    profilePhoto: profilePhoto,
    seguidores:
      usuario.seguidores ??
      usuario.followers ??
      usuario.followersCount ??
      usuario.contadorSeguidores ??
      usuario.seguidoresCount ??
      0,
    seguidos:
      usuario.seguidos ??
      usuario.following ??
      usuario.followingCount ??
      usuario.contadorSeguidos ??
      usuario.seguidosCount ??
      0,
    bio: usuario.bio || usuario.description || usuario.biografia || "",
  };
}

async function getUserInfo() {
  try {
    const token = getStoredToken() || getTokenFromStorageOrCookie();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log(
        "✓ Token en Authorization header:",
        token.substring(0, 20) + "...",
      );
    }

    const userId = getStoredUserId();
    const endpoint = userId
      ? `${API_BASE_URL}/user/${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/user/me`;

    console.log("📡 Obteniendo usuario desde:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    console.log("📥 Respuesta del servidor - Status:", response.status);

    // Si es 401 (sin token válido), hacer logout
    if (response.status === 401) {
      console.warn("❌ No autorizado (401), redirigiendo a login...");
      logout();
      return null;
    }

    // Si no es OK, loguear pero no fallar completamente
    if (!response.ok) {
      console.warn(
        "⚠️ No se pudo obtener información del usuario (status " +
          response.status +
          "). Usando datos del localStorage si están disponibles.",
      );

      // Intentar crear un usuario básico desde localStorage
      const storedUserId = getStoredUserId();
      const storedUsername = localStorage.getItem("username");
      const storedAvatar = localStorage.getItem("avatar");

      if (storedUserId || storedUsername) {
        currentUser = normalizarUsuarioBackend({
          id: storedUserId,
          userId: storedUserId,
          user: storedUsername || "Usuario",
          username: storedUsername || "Usuario",
          name: storedUsername || "Usuario",
          avatar: storedAvatar || null,
        });
        updateUserInterface();
        return currentUser;
      }

      updateUserInterface();
      return null;
    }

    // Parsear respuesta exitosa
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Datos del usuario recibidos:", data);

      // Intentar extraer usuario de diferentes estructuras de respuesta
      let usuarioData = data;
      if (data?.data && typeof data.data === "object") {
        usuarioData = data.data;
      } else if (data?.user && typeof data.user === "object") {
        usuarioData = data.user;
      }

      console.log("📋 Usuario parseado:", usuarioData);

      currentUser = normalizarUsuarioBackend(usuarioData);

      if (currentUser && currentUser.id != null) {
        try {
          localStorage.setItem("userId", String(currentUser.id));
          localStorage.setItem(
            "username",
            String(currentUser.username || currentUser.name),
          );
          const rolActual =
            currentUser.rol ||
            currentUser.role ||
            currentUser.credential?.rol ||
            currentUser.credential?.role ||
            "";
          if (rolActual) {
            localStorage.setItem("rol", String(rolActual));
            localStorage.setItem("role", String(rolActual));
          }
          if (
            currentUser.profileImage ||
            currentUser.profilePhoto ||
            currentUser.avatar
          ) {
            localStorage.setItem(
              "avatar",
              String(
                currentUser.profileImage ||
                  currentUser.profilePhoto ||
                  currentUser.avatar,
              ),
            );
          }
          console.log("✓ Datos del usuario guardados en localStorage");
        } catch (error) {
          console.warn("No se pudieron guardar datos en localStorage:", error);
        }
      }

      updateUserInterface();
      window.dispatchEvent(
        new CustomEvent("gnet:user-loaded", { detail: currentUser }),
      );
      window.dispatchEvent(
        new CustomEvent("gnet:user-updated", { detail: currentUser }),
      );
      console.log(
        "✓ Usuario actualizado:",
        currentUser.username || currentUser.name,
      );
      return currentUser;
    }
  } catch (error) {
    console.error("❌ Error al obtener información del usuario:", error);
    updateUserInterface();
    return null;
  }
}

function getUserAvatar(user) {
  const avatar =
    user && (user.profileImage || user.profilePhoto || user.avatar);
  if (avatar) {
    return `<img src="${avatar}" alt="Avatar usuario">`;
  }
  return `<img src="./assets/Logo/LogoAzul.jpg" alt="Avatar predeterminado">`;
}

function updateUserInterface() {
  if (currentUser) {
    const nombreUsuarioPerfil = document.querySelector(
      ".nombre-usuario-perfil h3",
    );
    if (nombreUsuarioPerfil) {
      nombreUsuarioPerfil.textContent =
        currentUser.name || currentUser.username || "Usuario";
    }

    const handlePerfil = document.querySelector(".nombre-usuario-perfil p");
    if (handlePerfil) {
      const handleBase =
        currentUser.handle ||
        currentUser.username ||
        currentUser.name ||
        "usuario";
      handlePerfil.textContent = handleBase.startsWith("@")
        ? handleBase
        : `@${handleBase.toLowerCase().replace(/\s+/g, "")}`;
    }

    const nombreUsuarioHeader = document.querySelector(
      ".usuario-header .nombre-usuario",
    );
    if (nombreUsuarioHeader) {
      nombreUsuarioHeader.textContent =
        currentUser.name || currentUser.username || "Usuario";
    }

    const avatarElements = document.querySelectorAll(
      ".mi-perfil .avatar, .usuario-header .avatar",
    );
    avatarElements.forEach((avatarContainer) => {
      avatarContainer.innerHTML = getUserAvatar(currentUser);
    });

    const contadorSeguidores = document.querySelector(".contador-seguidores");
    if (contadorSeguidores) {
      contadorSeguidores.textContent =
        currentUser.seguidores ??
        currentUser.followers ??
        currentUser.followersCount ??
        0;
    }

    const contadorSeguidos = document.querySelector(".contador-seguidos");
    if (contadorSeguidos) {
      contadorSeguidos.textContent =
        currentUser.seguidos ??
        currentUser.following ??
        currentUser.followingCount ??
        0;
    }
  }
}

function checkAuthentication() {
  const token = getStoredToken() || getTokenFromStorageOrCookie();
  if (!token) {
    window.location.replace("login.html");
    return false;
  }

  getUserInfo();
  return true;
}

function logout() {
  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("credentialId");
    localStorage.removeItem("userId");
    localStorage.removeItem("rol");
    localStorage.removeItem("role");
    localStorage.removeItem("requireProfile");
    localStorage.removeItem("pendingRecoveryEmail");
  } catch (error) {}
  currentUser = null;
  window.location.replace("login.html");
}

function getCurrentUser() {
  return currentUser;
}

function setCurrentUser(user) {
  currentUser = normalizarUsuarioBackend(user) || user;
  try {
    const rolActual =
      currentUser?.rol ||
      currentUser?.role ||
      currentUser?.credential?.rol ||
      currentUser?.credential?.role ||
      "";
    if (rolActual) {
      localStorage.setItem("rol", String(rolActual));
      localStorage.setItem("role", String(rolActual));
    }
  } catch (error) {}
  updateUserInterface();
  window.dispatchEvent(
    new CustomEvent("gnet:user-updated", { detail: currentUser }),
  );
  return currentUser;
}

window.setCurrentUser = setCurrentUser;

// Función para manejar errores de autenticación (401/403)
window.manejarErrorAutenticacion = function () {
  logout();
};

// Interceptor global para respuestas 401 (solo 401, no 403)
// 401 = sin token o token inválido → hacer logout
// 403 = token válido pero sin permisos → permitir continuar
const originalFetch = window.fetch;
window.fetch = function (...args) {
  return originalFetch.apply(this, args).then((response) => {
    if (response.status === 401) {
      console.warn(
        "No autorizado (401), token inválido. Redirigiendo a login...",
      );
      window.manejarErrorAutenticacion();
    }
    // 403 (Forbidden) no dispara logout: el token es válido,
    // solo que el usuario no tiene permisos para ese recurso
    return response;
  });
};

document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
});
