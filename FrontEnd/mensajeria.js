import { renderizarContactosChat } from "./chat.js";

// variables para abrir chat
const abrirChat = document.querySelector(".mensaje-btn");
const contenido = document.querySelector(".contenido");
const tituloSeccion = document.querySelector(".titulo-seccion");
const mensajeriaUi = document.querySelector(".mensajeria");

// Funcion para abrir chat
if (abrirChat) {
  abrirChat.addEventListener("click", async () => {
    if (contenido.style.display === "none") {
      contenido.style.display = "";
      tituloSeccion.style.display = "";
      mensajeriaUi.style.display = "none";
    } else {
      contenido.style.display = "none";
      tituloSeccion.style.display = "none";
      mensajeriaUi.style.display = "flex";
      // al abrir la UI, renderizar contactos
      try {
        await renderizarContactosChat();
      } catch (e) {
        console.error("Error renderizando contactos de chat", e);
      }
    }
  });
}
