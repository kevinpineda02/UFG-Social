import { renderizarContactosChat } from "./chat.js";

// variables para abrir chat
const abrirChat = document.querySelector(".mensaje-btn");
const contenido = document.querySelector(".contenido");
const tituloSeccion = document.querySelector(".titulo-seccion");
const mensajeriaUi = document.querySelector(".mensajeria");

function esVistaMovilMensajeria() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function setVisibilidadHamburguesa(visible) {
  const botonHamburguesa = document.getElementById("btn-hamburguesa-celular");
  const panelHamburguesa = document.getElementById("panel-hamburguesa-celular");

  if (visible) {
    if (botonHamburguesa) botonHamburguesa.style.display = "";
    return;
  }

  if (typeof window.cerrarMenuHamburguesaCelular === "function") {
    window.cerrarMenuHamburguesaCelular();
  } else if (panelHamburguesa) {
    panelHamburguesa.classList.remove("activo");
    panelHamburguesa.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-celular-abierto");
  }

  if (botonHamburguesa) botonHamburguesa.style.display = "none";
}

function activarVistaChat(esMovil = false) {
  if (esMovil) {
    document.body.classList.add("mensajeria-abierta");
    setVisibilidadHamburguesa(false);
  }
  if (contenido) contenido.style.display = "none";
  if (tituloSeccion) tituloSeccion.style.display = "none";
  if (mensajeriaUi) mensajeriaUi.style.display = "flex";
}

function desactivarVistaChat(esMovil = false) {
  if (esMovil) {
    document.body.classList.remove("mensajeria-abierta");
    document.body.classList.remove("chat-abierto");
    setVisibilidadHamburguesa(true);
  }
  if (typeof window.cerrarChatActual === "function") {
    window.cerrarChatActual();
  }
  if (contenido) contenido.style.display = "";
  if (tituloSeccion) tituloSeccion.style.display = "";
  if (mensajeriaUi) mensajeriaUi.style.display = "none";
}

// Funcion para abrir chat
if (abrirChat) {
  abrirChat.addEventListener("click", async () => {
    const esMovil = esVistaMovilMensajeria();

    if (esMovil) {
      if (document.body.classList.contains("mensajeria-abierta")) {
        desactivarVistaChat(true);
        return;
      }

      activarVistaChat(true);
      // al abrir la UI, renderizar contactos
      try {
        await renderizarContactosChat();
      } catch (e) {
        console.error("Error renderizando contactos de chat", e);
      }
    } else {
      if (mensajeriaUi && mensajeriaUi.style.display === "flex") {
        desactivarVistaChat(false);
      } else {
        activarVistaChat(false);
        try {
          await renderizarContactosChat();
        } catch (e) {
          console.error("Error renderizando contactos de chat", e);
        }
      }
    }
  });
}
