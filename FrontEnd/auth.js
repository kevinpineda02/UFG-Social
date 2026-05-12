/**
 * Script de autenticación para HomeNew
 *
 * @author Kevin Pineda
 * @license KevinPineda
 * @copyright © 2025 Kevin Pineda. Todos los derechos reservados.
 */

let currentUser = null;

function getTokenFromStorageOrCookie() {
  try {
    const stored = localStorage.getItem("token");
    if (stored) return stored;
  } catch (e) {}

  const match = document.cookie.match(new RegExp('(^| )jwt=([^;]+)'));
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
    return localStorage.getItem("token") || localStorage.getItem("jwt") || getCookie("jwt");
  } catch (error) {
    return getCookie("jwt");
  }
}

async function getUserInfo() {
  try {
    const token = getStoredToken() || getTokenFromStorageOrCookie();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:8081/user/me", {
      method: "GET",
      credentials: "include",
      headers,
    });
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUserInterface();
      window.dispatchEvent(
        new CustomEvent("gnet:user-loaded", { detail: currentUser }),
      );
      return data.user;
    } else {
      console.warn("No se pudo obtener información del usuario");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    return null;
  }
}

function getUserAvatar(user) {
  if (user && user.profilePhoto) {
    return `<img src="${user.profilePhoto}" alt="Avatar usuario">`;
  }
  return `<img src="./assets/Logo/LogoAzul.jpg" alt="Avatar predeterminado">`;
}

function updateUserInterface() {
  if (currentUser) {
    const nombreUsuarioPerfil = document.querySelector(
      ".nombre-usuario-perfil h3",
    );
    if (nombreUsuarioPerfil) {
      nombreUsuarioPerfil.textContent = currentUser.username;
    }

    const handlePerfil = document.querySelector(".nombre-usuario-perfil p");
    if (handlePerfil) {
      handlePerfil.textContent = `@${currentUser.username.toLowerCase()}`;
    }

    const nombreUsuarioHeader = document.querySelector(
      ".usuario-header .nombre-usuario",
    );
    if (nombreUsuarioHeader) {
      nombreUsuarioHeader.textContent = currentUser.username;
    }

    const avatarElements = document.querySelectorAll(
      ".mi-perfil .avatar, .usuario-header .avatar",
    );
    avatarElements.forEach((avatarContainer) => {
      avatarContainer.innerHTML = getUserAvatar(currentUser);
    });
  }
}

function checkAuthentication() {
  const token = getStoredToken() || getTokenFromStorageOrCookie();
  if (!token) {
    window.location.replace("/login.html");
    return false;
  }

  // Verificar si el usuario tiene perfil completo; si no, forzar completar datos
  getUserInfo().then((user) => {
    try {
      const hasProfile = user && user.name && user.username && user.profilePhoto;
      if (!hasProfile) {
        try { localStorage.setItem('requireProfile', '1'); } catch (e) {}
        window.location.replace('/login.html');
      }
    } catch (e) {}
  });
  return true;
}

function logout() {
  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
  } catch (error) {}
  currentUser = null;
  window.location.replace("/");
}

function getCurrentUser() {
  return currentUser;
}

function setCurrentUser(user) {
  currentUser = user;
  updateUserInterface();
  window.dispatchEvent(new CustomEvent("gnet:user-updated", { detail: user }));
  return currentUser;
}

window.setCurrentUser = setCurrentUser;

document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
});
