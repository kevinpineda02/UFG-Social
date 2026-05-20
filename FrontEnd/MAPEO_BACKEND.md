# Mapeo de Peticiones al Backend - UFGSocial (PublicationRestController)

**Base URL**: `http://localhost:8081`

---

## Endpoints de Publicaciones

### 1. Listar todas (feed general)
```
GET /publication
```
- **Uso**: `obtenerPublicacionesBackend()` en `inicio.js`
- **Respuesta**: `PublicationDto[]`

### 2. Crear publicación
```
POST /publication
Content-Type: application/json
Authorization: Bearer <token>
```
- **Uso**: `crearPublicacionBackend()` en `inicio.js`
- **Body**:
```json
{
  "idUser": 120001,
  "description": "texto",
  "videoUrl": null,
  "images": [
    { "imageUrl": "data:image/png;base64,...", "orderImage": 1 }
  ]
}
```

### 3. Listar por usuario
```
GET /publication/user/{userId}
```
- **Uso**: `obtenerPublicacionesPorUsuario(userId)` en `inicio.js`

### 4. Dar like
```
POST /publication/{publicationId}/like/{userId}
```
- **Uso**: `darLikeBackend(publicationId)` en `inicio.js`

### 5. Quitar like
```
DELETE /publication/{publicationId}/like/{userId}
```
- **Uso**: `quitarLikeBackend(publicationId)` en `inicio.js`

### 6. Verificar like
```
GET /publication/{publicationId}/like/{userId}
```
- **Respuesta**: `true` / `false`
- **Uso**: `verificarLikeBackend(publicationId)` en `inicio.js`

### 7. Contar likes
```
GET /publication/{publicationId}/likes/count
```
- **Respuesta**: `5` (número)
- **Uso**: `obtenerCantidadLikesBackend(publicationId)` en `inicio.js`

### 8. Listar imágenes
```
GET /publication/{publicationId}/images
```

### 9. Agregar imagen
```
POST /publication/{publicationId}/images
```

### 10. Eliminar imagen
```
DELETE /publication/images/{imageId}
```

### 11. Listar comentarios
```
GET /publication/{publicationId}/comments
```
- **Uso**: `obtenerComentariosBackend(publicationId)` en `inicio.js`

### 12. Crear comentario
```
POST /publication/{publicationId}/comments/{userId}
Content-Type: application/json
```
- **Body**: `{ "comment": "texto del comentario" }`
- **Uso**: `agregarComentarioBackend(publicationId, texto)` en `inicio.js`

### 13. Eliminar comentario
```
DELETE /publication/comments/{commentId}/user/{userId}
```
- **Uso**: `eliminarComentarioBackend(commentId)` en `inicio.js`

---

## Formato de Publicación (PublicationDto)

```json
{
  "id": 60001,
  "idUser": 120001,
  "description": "texto de la publicación",
  "videoUrl": null,
  "likes": 5,
  "coments": 2,
  "user": "Kevin Pineda",
  "username": "kevinpineda",
  "profilePhoto": "data:image/png;base64,...",
  "images": [
    { "idImage": 1, "imageUrl": "data:image/png;base64,...", "orderImage": 1 }
  ]
}
```

---

## Funciones del Frontend

| Función | Endpoint | Método |
|---------|----------|--------|
| `obtenerPublicacionesBackend()` | `/publication` | GET |
| `obtenerPublicacionesPorUsuario(id)` | `/publication/user/{id}` | GET |
| `crearPublicacionBackend(texto, imagenes)` | `/publication` | POST |
| `darLikeBackend(pubId)` | `/publication/{id}/like/{userId}` | POST |
| `quitarLikeBackend(pubId)` | `/publication/{id}/like/{userId}` | DELETE |
| `verificarLikeBackend(pubId)` | `/publication/{id}/like/{userId}` | GET |
| `obtenerCantidadLikesBackend(pubId)` | `/publication/{id}/likes/count` | GET |
| `obtenerComentariosBackend(pubId)` | `/publication/{id}/comments` | GET |
| `agregarComentarioBackend(pubId, texto)` | `/publication/{id}/comments/{userId}` | POST |
| `eliminarComentarioBackend(commentId)` | `/publication/comments/{id}/user/{userId}` | DELETE |
| `eliminarPublicacionBackend(pubId)` | `/publication/{id}` | DELETE |

## Helper

```javascript
getUserIdForApi()  // Obtiene el userId desde JWT o localStorage
```
