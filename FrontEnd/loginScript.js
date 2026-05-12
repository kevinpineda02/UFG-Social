/**
 * Script de Funcionalidad para Login y Registro
 *
 * @author Kevin Pineda
 * @license KevinPineda
 * @copyright © 2025 Kevin Pineda. Todos los derechos reservados.
 */

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".logueo");
  const registroForm = document.querySelector(".registro");
  // verificación por correo eliminada — flujo directo al formulario de datos
  const recuperarForm = document.querySelector(".recuperar");
  const formContainer = document.querySelector(".form-container");
  const themeToggle = document.querySelector(".theme");
  const sunIcon = document.querySelector(".theme .sun");
  const moonIcon = document.querySelector(".theme svg:not(.sun)");

  const showRegisterBtn = document.getElementById("showRegister");
  const showLoginBtn = document.getElementById("showLogin");
  const showRecoveryBtn = document.getElementById("showRecovery");
  const backToLoginBtn = document.getElementById("backToLogin");
  const resendCodeBtn = document.getElementById("resendCode");
  const profileInput = document.getElementById("profileImage");
  const fileNameSpan = document.getElementById("fileName");
  const profilePreview = document.getElementById("profileImagePreview");
  const defaultProfilePreview = "./assets/perfil/perfil1.png";

  function applyLoginTheme(themeName) {
    const html = document.documentElement;
    if (themeName === "light") {
      html.classList.add("modo-claro");
    } else {
      html.classList.remove("modo-claro");
    }

    if (sunIcon) {
      sunIcon.style.display = themeName === "light" ? "none" : "block";
    }

    if (moonIcon) {
      moonIcon.style.display = themeName === "light" ? "block" : "none";
    }

    try {
      localStorage.setItem("loginTheme", themeName);
    } catch (error) {
      console.warn("No se pudo guardar el tema del login", error);
    }
  }

  function getInitialTheme() {
    try {
      const savedTheme = localStorage.getItem("loginTheme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch (error) {
      console.warn("No se pudo leer el tema del login", error);
    }

    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  applyLoginTheme(getInitialTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const isLight = document.documentElement.classList.contains("modo-claro");
      applyLoginTheme(isLight ? "dark" : "light");
    });
  }

  function showMessage(message) {
    document.getElementById("messageText").textContent = message;
    document.getElementById("messageModal").classList.add("show");
  }

  function switchForm(hideForm, showForm) {
    hideForm.style.animation = "fadeOut 0.3s ease-out forwards";

    setTimeout(() => {
      hideForm.style.display = "none";
      showForm.style.display = "block";
      showForm.style.animation = "scaleIn 0.5s ease-out forwards";

      const closeBtn = document.getElementById("backToRegister");
      // Mostrar botón de cierre solo si se muestra el formulario de datos de usuario
      if (showForm && showForm.classList && showForm.classList.contains("form-one-loguin")) {
        closeBtn.style.display = "block";
      } else if (closeBtn) {
        closeBtn.style.display = "none";
      }
    }, 300);
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", function (e) {
      e.preventDefault();
      switchForm(loginForm, registroForm);
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      switchForm(registroForm, loginForm);
    });
  }

  if (showRecoveryBtn) {
    showRecoveryBtn.addEventListener("click", function (e) {
      e.preventDefault();
      switchForm(loginForm, recuperarForm);
    });
  }

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      switchForm(recuperarForm, loginForm);
    });
  }

  const loginFormElement = loginForm.querySelector("form");
  if (loginFormElement) {
    const passwordError = loginFormElement.querySelector(".password-error");

    function clearPasswordError() {
      if (passwordError) {
        passwordError.textContent = "";
        passwordError.classList.remove("is-visible");
      }
    }

    function showPasswordError(message) {
      if (passwordError) {
        passwordError.textContent = message;
        passwordError.classList.add("is-visible");
        return;
      }
      showMessage(message);
    }

    loginFormElement.addEventListener("submit", function (e) {
      if (!loginFormElement.reportValidity()) {
        return;
      }
      clearPasswordError();
      e.preventDefault();
      const correo = loginFormElement
        .querySelector('input[name="correo"]')
        .value.trim();
      const contrasena = loginFormElement.querySelector(
        'input[name="contrasena"]',
      ).value;

      fetch("http://127.0.0.1:8081/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const mensaje =
              res.status === 401 || res.status === 403
                ? data.message || "Contraseña incorrecta"
                : data.message || "Error en el servidor";
            if (res.status === 401 || res.status === 403) {
              showPasswordError(mensaje);
            } else {
              showMessage(mensaje);
            }
            return;
          }
          try { const token = data.token || data.accessToken || data.jwt; if (token) localStorage.setItem("token", token); } catch (e) {}
          // Tras autenticar, verificar si el perfil del usuario está completo
          const tokenSaved = (data.token || data.accessToken || data.jwt) || (localStorage.getItem("token"));
          checkProfileAndRedirect(tokenSaved, data.redirect || "inicio.html", loginForm);
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }

  async function checkProfileAndRedirect(token, fallbackRedirect, hideFormEl) {
    try {
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:8081/user/me", {
        method: "GET",
        headers,
        credentials: "include",
      });
      const profile = await res.json().catch(() => ({}));

      const hasProfile = profile && profile.name && profile.username && profile.profilePhoto;
      if (hasProfile) {
        window.location.replace(fallbackRedirect);
        return;
      }

      // Si no tiene perfil completo, mostrar formulario de datos de usuario
      const userDataPanel = document.querySelector('.form-one-loguin');
      if (userDataPanel) {
        // guardar bandera para que, si viene desde otras páginas, se muestre el panel
        try { localStorage.setItem('requireProfile', '1'); } catch (e) {}
        if (hideFormEl) switchForm(hideFormEl, userDataPanel);
        else userDataPanel.style.display = 'block';
      } else {
        window.location.replace(fallbackRedirect);
      }
    } catch (err) {
      console.error('Error comprobando perfil:', err);
      window.location.replace(fallbackRedirect);
    }
  }

  const registroFormElement = registroForm.querySelector("form");
  if (registroFormElement) {
    registroFormElement.addEventListener("submit", function (e) {
      if (!registroFormElement.reportValidity()) {
        return;
      }
      e.preventDefault();

      const submitBtn = registroFormElement.querySelector(".btn-primary");
      const correo = registroFormElement
        .querySelector('input[name="correo"]')
        .value.trim();
      const contrasena = registroFormElement.querySelector(
        'input[name="contrasena"]',
      ).value;

      const originalText = submitBtn ? submitBtn.textContent : "Registrarse";
      if (submitBtn) {
        submitBtn.textContent = "Registrando...";
        submitBtn.style.opacity = "0.7";
      }

      fetch("http://127.0.0.1:8081/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn(data.message || "Error al registrar");
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.style.opacity = "1";
            }
            return;
          }

          try {
            const token = data.token || data.accessToken || data.jwt;
            if (token) {
              localStorage.setItem("token", token);
              console.log('✓ Token guardado en localStorage:', token.substring(0, 20) + '...');
            } else {
              console.warn('⚠ No se recibió token en respuesta de registro');
            }
            if (data.credentialId) {
              localStorage.setItem("credentialId", String(data.credentialId));
              console.log('✓ credentialId guardado:', data.credentialId);
            }
          } catch (e) {}

          // Asegurar que, si el backend estableció cookie HttpOnly, esté disponible
          // antes de mostrar el formulario; por eso usamos credentials: 'include' arriba.
          const userDataPanel = document.querySelector('.form-one-loguin');
          if (userDataPanel) {
            switchForm(registroForm, userDataPanel);
          } else {
            // fallback a inicio si no existe el panel
            window.location.replace('inicio.html');
          }
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = "1";
          }
        })
        .catch((err) => {
          console.error(err);
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = "1";
          }
        });
    });
  }

  const messageModal = document.getElementById("messageModal");
  const messageOk = document.getElementById("messageOk");

  if (messageOk) {
    messageOk.addEventListener("click", function () {
      if (messageModal) messageModal.classList.remove("show");
    });
  }

  const backToRegisterBtn = document.getElementById("backToRegister");
  if (backToRegisterBtn) {
    backToRegisterBtn.addEventListener("click", function () {
      // cerrar formulario de datos y volver a registro
      const userDataFormEl = document.querySelector('.form-one-loguin');
      if (userDataFormEl) {
        switchForm(userDataFormEl, registroForm);
      }
    });
  }

  const recuperarFormElement = recuperarForm.querySelector("form");
  if (recuperarFormElement) {
    recuperarFormElement.addEventListener("submit", function (e) {
      if (!recuperarFormElement.reportValidity()) {
        return;
      }
      e.preventDefault();

      const submitBtn = recuperarFormElement.querySelector(".btn-primary");
      const emailRecovery = recuperarFormElement
        .querySelector('input[name="emailRecovery"]')
        .value.trim();

      const originalText = submitBtn ? submitBtn.textContent : "Enviar Código";
      if (submitBtn) {
        submitBtn.textContent = "Enviando..";
        submitBtn.style.opacity = "0.7";
      }

      fetch("/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailRecovery }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn(
              data.message || "Error al enviar código de recuperación",
            );
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.style.opacity = "1";
            }
            return;
          }

          showMessage(data.message || "Código de recuperación enviado");

          try {
            localStorage.setItem("pendingRecoveryEmail", emailRecovery);
          } catch (e) {}

          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = "1";
          }
        })
        .catch((err) => {
          console.error(err);
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = "1";
          }
        });
    });
  }

  // Verificación por código eliminada: no hay manejo de inputs de código

  if (profileInput && fileNameSpan && profilePreview) {
    let currentPreviewUrl = null;

    profilePreview.style.backgroundImage = `url("${defaultProfilePreview}")`;
    profilePreview.style.backgroundSize = "cover";
    profilePreview.style.backgroundPosition = "center";
    profilePreview.style.backgroundRepeat = "no-repeat";

    profileInput.addEventListener("change", function () {
      const selectedFile = this.files && this.files[0];

      if (selectedFile) {
        fileNameSpan.textContent = selectedFile.name;
        fileNameSpan.classList.add("selected");

        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        currentPreviewUrl = URL.createObjectURL(selectedFile);
        profilePreview.style.backgroundImage = `url("${currentPreviewUrl}")`;
      } else {
        fileNameSpan.textContent = "No file selected.";
        fileNameSpan.classList.remove("selected");
        profilePreview.style.backgroundImage = `url("${defaultProfilePreview}")`;

        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
          currentPreviewUrl = null;
        }
      }
    });
  }

  // Handler para el formulario de datos de usuario (después de crear la cuenta)
  const userDataForm = document.querySelector(".form-one-loguin form");
  if (userDataForm) {
    // Si venimos forzados a completar perfil desde otra página, mostrar el panel
    try {
      if (localStorage.getItem('requireProfile') === '1') {
        const panel = document.querySelector('.form-one-loguin');
        if (panel) panel.style.display = 'block';
        localStorage.removeItem('requireProfile');
      }
    } catch (e) {}
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    function getTokenFromStorageOrCookie() {
      try {
        const stored = localStorage.getItem("token");
        if (stored) return stored;
      } catch (e) {}

      const match = document.cookie.match(new RegExp('(^| )jwt=([^;]+)'));
      if (match) return match[2];
      return null;
    }

    userDataForm.addEventListener("submit", async function (e) {
      if (!userDataForm.reportValidity()) return;
      e.preventDefault();

      const submitBtn = userDataForm.querySelector('.btn-primary') || userDataForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : null;
      if (submitBtn) {
        submitBtn.textContent = "Enviando...";
        submitBtn.style.opacity = "0.7";
      }

      try {
        const name = userDataForm.querySelector('input[name="nombre"]').value.trim();
        const username = userDataForm.querySelector('input[name="username"]').value.trim();
        const fileInput = userDataForm.querySelector('input[name="profileImage"]');
        let profileImageData = null;

        if (fileInput && fileInput.files && fileInput.files[0]) {
          profileImageData = await fileToBase64(fileInput.files[0]);
        }

        const credentialId = localStorage.getItem("credentialId");
        const body = {
          name,
          username,
          credentialId: credentialId ? Number(credentialId) : null,
          profilePhoto: profileImageData || null,
        };

        const token = getTokenFromStorageOrCookie();
        console.log('Token encontrado:', token ? token.substring(0, 20) + '...' : 'NINGUNO');

        const headers = { "Content-Type": "application/json" };
        if (token) { headers["Authorization"] = `Bearer ${token}`; console.log('✓ Header Authorization añadido'); } else { console.warn('⚠ Sin token, usando solo credentials: include'); }

        console.log('📤 Enviando POST /user con body:', { name, username, credentialId: credentialId ? Number(credentialId) : null, profilePhotoLength: profileImageData ? profileImageData.length : 0 });
        console.log('📤 Headers:', headers);

        const res = await fetch("http://localhost:8081/user", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));
        console.log('📥 Respuesta Status:', res.status, 'Data:', data);
        
        if (!res.ok) {
          const msg = data.message || data.error || `Error ${res.status} en el registro de datos de usuario`;
          console.error('❌ Error del servidor:', msg);
          showMessage(msg);
          throw new Error(msg);
        }
        console.log('✓ Éxito: Perfil guardado');

        // Si el servidor devuelve una redirección, usarla; si no, llevar a inicio.html
        if (data.redirect) {
          window.location.replace(data.redirect);
        } else {
          window.location.replace("inicio.html");
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText || "Crear Cuenta";
          submitBtn.style.opacity = "1";
        }
      }
    });
  }
});

