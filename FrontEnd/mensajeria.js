//variables para abrir chat
const abrirChat = document.querySelector(".mensaje-btn");
const contenido = document.querySelector(".contenido");
const tituloSeccion = document.querySelector(".titulo-seccion")

//Funcion para abrir chat
abrirChat.addEventListener("click", () => {
    if (contenido.style.display === "none") {
        contenido.style.display = "";
        tituloSeccion.style.display = ""
    } else {
        contenido.style.display = "none";
        tituloSeccion.style.display = "none"
    }
});


