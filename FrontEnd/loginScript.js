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
  const recuperarForm = document.querySelector(".recuperar");
  const formContainer = document.querySelector(".form-container");
  const themeToggle = document.querySelector(".theme");
  const sunIcon = document.querySelector(".theme .sun");
  const moonIcon = document.querySelector(".theme svg:not(.sun)");

  const showRegisterBtn = document.getElementById("showRegister");
  const showLoginBtn = document.getElementById("showLogin");
  const showRecoveryBtn = document.getElementById("showRecovery");
  const backToLoginBtn = document.getElementById("backToLogin");
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
          if (data.token) {
            try {
              localStorage.setItem("jwt", data.token);
              document.cookie = `jwt=${encodeURIComponent(data.token)}; path=/; SameSite=Lax`;
            } catch (error) {
              console.warn("No se pudo guardar el token", error);
            }
          }
          if (data.redirect) {
            window.location.replace(data.redirect);
          } else {
            window.location.replace("inicio.html");
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
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
      const confirmPasswordInput = registroFormElement.querySelector(
        'input[name="confirmPassword"]',
      );
      const registerError =
        registroFormElement.querySelector(".register-error");
      const confirmPassword = confirmPasswordInput.value;

      function clearRegisterError() {
        if (registerError) {
          registerError.textContent = "";
          registerError.classList.remove("is-visible");
        }
      }

      function showRegisterError(message) {
        if (registerError) {
          registerError.textContent = message;
          registerError.classList.add("is-visible");
          return;
        }
        showMessage(message);
      }

      if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", clearRegisterError, {
          once: true,
        });
      }

      clearRegisterError();

      if (contrasena !== confirmPassword) {
        showRegisterError("Las contraseñas no coinciden");
        return;
      }

      if (submitBtn) {
        submitBtn.textContent = "Registrando...";
        submitBtn.style.opacity = "0.7";
      }

      fetch("http://127.0.0.1:8081/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            showMessage(data.message || "Error al registrar la cuenta");
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.style.opacity = "1";
            }
            return;
          }

          try {
            localStorage.removeItem("gnet_perfil_setup_done");
            localStorage.removeItem("gnet_perfil_usuario");
          } catch (e) {}

          if (data.token) {
            try {
              localStorage.setItem("jwt", data.token);
              document.cookie = `jwt=${encodeURIComponent(data.token)}; path=/; SameSite=Lax`;
            } catch (error) {
              console.warn("No se pudo guardar el token", error);
            }
          }

          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = "1";
          }

          if (data.redirect) {
            window.location.replace(data.redirect);
          } else {
            window.location.replace("inicio.html");
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

  window.addEventListener("click", function (event) {
    if (event.target === messageModal) {
      messageModal.classList.remove("show");
    }
  });

  const messageOk = document.getElementById("messageOk");

  if (messageOk) {
    messageOk.addEventListener("click", function () {
      messageModal.classList.remove("show");
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

  const verificarFormElement = verificarForm.querySelector("form");
  if (verificarFormElement) {
    verificarFormElement.addEventListener("submit", function (e) {
      if (!verificarFormElement.reportValidity()) {
        return;
      }
      e.preventDefault();

      const codigoInputs = document.querySelectorAll(".codigo-input");
      const codigo = Array.from(codigoInputs)
        .map((input) => input.value)
        .join("");

      const pendingEmail = localStorage.getItem("pendingEmail");

      fetch("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: codigo }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn(data.message || "Código inválido o expirado");
            return;
          }
          try {
            localStorage.removeItem("pendingEmail");
          } catch (e) {}
          if (data.redirect) {
            window.location.replace(data.redirect);
          } else {
            showMessage(data.message || "Cuenta verificada exitosamente");
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }

  const codigoInputs = document.querySelectorAll(".codigo-input");
  codigoInputs.forEach((input, index) => {
    input.addEventListener("input", function (e) {
      this.value = this.value.replace(/[^0-9]/g, "");

      if (this.value.length === 1 && index < 5) {
        codigoInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        codigoInputs[index - 1].focus();
      }
    });
  });

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
});

