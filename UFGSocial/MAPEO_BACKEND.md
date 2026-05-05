# Mapeo de Peticiones al Backend - UFGSocial

**Fecha**: 4 de mayo de 2026  
**Estado**: Conversión completa a consumo de backend (sin fallback a localStorage)

---

## Configuración Base

- **Base URL**: `http://localhost:3001/api`
- **Protocolo**: REST/HTTP con JSON
- **Autenticación**: JWT en cookies (gestiona auth.js)

---

## Endpoints en Uso

### 1. **Verificación de Salud**

```
GET /health
```

- **Uso**: `verificarConexionBackend()` - Verificar si el backend está disponible
- **Archivo**: `inicio.js` línea ~30
- **Respuesta esperada**: `{ message: string }`
- **Crítico**: SÍ - La aplicación requiere conexión

---

### 2. **Obtener Todas las Publicaciones**

```
GET /publicaciones
```

- **Uso**: `obtenerPublicacionesBackend()` - Cargar feed de publicaciones
- **Archivo**: `inicio.js` línea ~57
- **Llamado desde**: `cargarPublicaciones()` via `obtenerPublicacionesHybrid()`
- **Respuesta esperada**:

```json
{
  "success": true,
  "data": [
    {
      "id": "pub_123",
      "contenido": "Texto de la publicación",
      "autor": "username",
      "autorHandle": "@username",
      "autorAvatar": "url/avatar.jpg",
      "fecha": "2026-05-04T10:30:00Z",
      "fechaCreacion": "2026-05-04T10:30:00Z",
      "likes": 5,
      "imagen": "url/imagen.jpg (opcional)",
      "comentarios": 2
    }
  ]
}
```

---

### 3. **Crear Nueva Publicación**

```
POST /publicaciones
```

- **Uso**: `crearPublicacionBackend()` - Crear publicación con imagen/texto
- **Archivo**: `inicio.js` línea ~73
- **Body**: `FormData` (para soportar archivos)
  - `contenido`: string (requerido)
  - `autorUsername`: string
  - `autorHandle`: string
  - `autorAvatar`: string
  - `categoria`: string (opcional, default: "general")
  - `etiquetas`: JSON string array (opcional)
  - `imagen`: File object (opcional)
- **Respuesta esperada**: Objeto publicación creada con ID

---

### 4. **Dar Like a Publicación**

```
POST /publicaciones/{id}/like
DELETE /publicaciones/{id}/like
```

- **Uso**: `darLikePublicacion()` y `quitarLikePublicacion()`
- **Archivo**: `inicio.js` línea ~108-138
- **Parámetros**:
  - `id`: ID de la publicación
- **Respuesta esperada**: `{ success: true, likes: number }`

---

### 5. **Agregar Comentario a Publicación**

```
POST /publicaciones/{id}/comentarios
```

- **Uso**: `agregarComentarioBackend()` - Crear comentario
- **Archivo**: `inicio.js` línea ~154+
- **Body**: `JSON`
  - `contenido`: string (texto del comentario)
  - `autorUsername`: string
  - `autorHandle`: string
  - `autorAvatar`: string
- **Respuesta esperada**: Objeto comentario creado

---

### 6. **Información del Usuario Autenticado**

```
GET /user-info
```

- **Ubicación**: `auth.js` línea ~23
- **Uso**: `getUserInfo()` - Obtener datos del usuario actual
- **Autenticación**: Requiere JWT en cookie
- **Respuesta esperada**:

```json
{
  "user": {
    "username": "username",
    "name": "Nombre Completo",
    "profileImage": "url/avatar.jpg",
    "email": "user@example.com",
    "id": "user_id"
  }
}
```

---

## Flujo de Datos

### Al Cargar la Página

1. `auth.js` → `checkAuthentication()` → `getUserInfo()` → `currentUser` global
2. `getUserInfo()` hace GET `/user-info`
3. Se actualiza la interfaz via `updateUserInterface()`
4. `inicio.js` → `inicializarBackend()` → `verificarConexionBackend()` → GET `/health`
5. `cargarPublicaciones()` → `obtenerPublicacionesHybrid()` → GET `/publicaciones`

### Datos del Usuario

- **Fuente Principal**: `currentUser` (desde `/user-info` en auth.js)
- **Acceso**: `getCurrentUser()` devuelve el objeto user
- **Función**: `obtenerDatosUsuario()` extrae username, handle, avatar
- **Sin localStorage**: Ya no se guardan datos de usuario en localStorage

### Publicaciones

- **Carga Inicial**: GET `/publicaciones` al iniciar página
- **Creación Nueva**: POST `/publicaciones` con FormData
- **Sin Sync localStorage**: Las publicaciones ya no se sincronizaban con localStorage

---

## Cambios Realizados (4 de mayo)

### ✅ Eliminado

- `obtenerDatosUsuarioLocales()` - Cargaba datos de localStorage
- `guardarDatosUsuarioLocales()` - Guardaba datos en localStorage
- `obtenerAvatarLocal()` - Obtenía avatar de localStorage
- 6 llamadas a `guardarPublicaciones()` - Sincronizaba con localStorage
- Función `obtenerPublicacionesLocalStorage()` - Ya no se usa
- Fallback a localStorage en `obtenerPublicacionesHybrid()`

### ✅ Actualizado

- `obtenerDatosUsuario()` - Ahora solo obtiene de `currentUser` (backend)
- `obtenerPublicacionesHybrid()` - Siempre usa backend, sin fallback
- `inicializarBackend()` - Error obligatorio si no hay conexión

### ⏳ Aún con localStorage

- Comentarios: `cargarComentarios()` y `guardarComentarios()` aún usan localStorage
- (Pendiente para próximas iteraciones)

---

## Variables Globales Clave

```javascript
// En auth.js
let currentUser = null;  // Objeto usuario del backend (/user-info)
function getCurrentUser()  // Retorna currentUser

// En inicio.js
const API_BASE_URL = "http://localhost:3001/api"
const API_ENDPOINTS = {
  health: "...",
  publicaciones: "...",
  usuario: "..."
}
let backendConectado = false;  // Estado de conexión
let usarBackend = true;  // Control para cambiar modo
```

---

## Debugging

### Verificar estado del backend

```javascript
// En consola del navegador
backendConectado; // true/false
currentUser; // null o {username, name, profileImage, ...}
```

### Logs importante

- ✅ "Backend conectado" - Backend disponible
- ❌ "Backend no disponible" - Falta conexión (ERROR CRÍTICO ahora)
- 📡 "Obteniendo publicaciones del backend" - Llamada GET /publicaciones
- 📦 "X publicaciones nuevas" - Procesando respuesta

---

## Requisitos del Backend

Para que la aplicación funcione correctamente, el backend debe:

1. ✅ Estar ejecutándose en `http://localhost:3001`
2. ✅ Exponer `/api/health` (verificación simple)
3. ✅ Tener middleware de autenticación JWT en cookies
4. ✅ Exponer `/user-info` (retornar usuario autenticado)
5. ✅ Exponer `/api/publicaciones` (GET/POST)
6. ✅ Exponer `/api/publicaciones/{id}/like` (POST/DELETE)
7. ✅ Exponer `/api/publicaciones/{id}/comentarios` (GET/POST)

---

## Próximos Pasos

- [ ] Migrar comentarios a backend (remover guardarComentarios/cargarComentarios)
- [ ] Agregar endpoint de actualización de perfil (PUT `/usuario`)
- [ ] Agregar endpoint de búsqueda (GET `/publicaciones/search`)
- [ ] Agregar autenticación de refresh token
