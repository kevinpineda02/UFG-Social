import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        feed: resolve(__dirname, 'feed.html'),
        mensajes: resolve(__dirname, 'mensajes.html'),
        perfil: resolve(__dirname, 'perfil.html'),
        publicacion: resolve(__dirname, 'publicacion.html'),
        seguidores: resolve(__dirname, 'seguidores.html'),
        solicitudes: resolve(__dirname, 'solicitudes.html'),
      },
    },
  },
});