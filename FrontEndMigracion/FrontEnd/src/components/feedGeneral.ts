export async function feedGeneral() {
    
    //Contenedor feed
    const contenedorFeed = document.querySelector(".feed")

    
    //Titulo del feed
    const tituloContenedorFeed = document.createElement('div')
    tituloContenedorFeed.classList.add('titulo-feed')
    const tituloTextoFeed = document.createElement('h2')
    tituloTextoFeed.classList.add('titulo-texto-feed')
    tituloTextoFeed.textContent = "Feed"

    //Renderizacion del titulo
    tituloContenedorFeed.appendChild(tituloTextoFeed)
    contenedorFeed?.appendChild(tituloContenedorFeed)



}