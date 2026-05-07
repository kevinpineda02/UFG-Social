/**
 * Script de autenticación para HomeNew
 *
 * @author Kevin Pineda
 * @license KevinPineda
 * @copyright © 2025 Kevin Pineda. Todos los derechos reservados.
 */

let currentUser = null;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

async function getUserInfo() {
  try {
    const response = await fetch("/user-info", {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUserInterface();
      return data.user;
    } else {
      throw new Error("No se pudo obtener información del usuario");
    }
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    return null;
  }
}

function getUserAvatar(user) {
  if (user && user.profileImage) {
    return `<img src="${user.profileImage}" alt="Avatar usuario">`;
  }
  return `<img src="./assets/Logo/LogoAzul.jpg" alt="Avatar predeterminado">`;
}

function updateUserInterface() {
  if (currentUser) {
    const nombreUsuarioPerfil = document.querySelector(".nombre-usuario-perfil h3");
    if (nombreUsuarioPerfil) {
      nombreUsuarioPerfil.textContent = currentUser.username;
    }

    const handlePerfil = document.querySelector(".nombre-usuario-perfil p");
    if (handlePerfil) {
      handlePerfil.textContent = `@${currentUser.username.toLowerCase()}`;
    }

    const nombreUsuarioHeader = document.querySelector(".usuario-header .nombre-usuario");
    if (nombreUsuarioHeader) {
      nombreUsuarioHeader.textContent = currentUser.username;
    }

    const avatarElements = document.querySelectorAll(".mi-perfil .avatar, .usuario-header .avatar");
    avatarElements.forEach((avatarContainer) => {
      avatarContainer.innerHTML = getUserAvatar(currentUser);
    });
  }
}

function checkAuthentication() {
  const token = getCookie("jwt");
  if (!token) {
    window.location.replace("/");
    return false;
  }
  getUserInfo();
  return true;
}

function logout() {
  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  currentUser = null;
  window.location.replace("/");
}

function getCurrentUser() {
  return currentUser;
}

document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
});