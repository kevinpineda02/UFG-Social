// chat.js
// Implementación de mensajería en tiempo real usando Firebase Firestore

import { db } from "./firebaseConfig.js";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const API_BASE =
  typeof window.API_BASE_URL_HOME !== "undefined"
    ? window.API_BASE_URL_HOME
    : "http://localhost:8081";

const currentChat = {
  chatId: null,
  receiverId: null,
  myId: null,
  unsubscribe: null,
};

let _sendListenerAttached = false;

function getAuthUserId() {
  if (typeof window.getUserIdForApi === "function") {
    return window.getUserIdForApi();
  }

  const possibleIds = [
    localStorage.getItem("userId"),
    localStorage.getItem("idUser"),
    localStorage.getItem("usuarioId"),
  ];

  for (const value of possibleIds) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return null;
}

function getAuthHeadersSafe(extra = {}) {
  if (typeof window.getAuthHeaders === "function") {
    return window.getAuthHeaders(extra);
  }

  const token =
    localStorage.getItem("jwt") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchAuth(url, options = {}) {
  if (typeof window.fetchConAutenticacion === "function") {
    return window.fetchConAutenticacion(url, options);
  }

  return fetch(url, options);
}

function generarChatId(userId1, userId2) {
  return [Number(userId1), Number(userId2)].sort((a, b) => a - b).join("_");
}

async function obtenerContactosChat() {
  const userId = getAuthUserId();

  if (!userId) {
    console.error("No hay userId para cargar contactos del chat");
    return [];
  }

  const response = await fetchAuth(`${API_BASE}/chat/contacts/${userId}`, {
    method: "GET",
    headers: getAuthHeadersSafe({ Accept: "application/json" }),
  });

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error(
      "Error obteniendo contactos del chat:",
      response ? response.status : "sin respuesta",
      errorText,
    );
    return [];
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function renderizarContactosChat() {
  const contenedor = document.getElementById("chatContactsList");

  if (!contenedor) {
    console.error("No existe el contenedor #chatContactsList");
    return;
  }

  contenedor.innerHTML = '<p class="chat-empty-text">Cargando contactos...</p>';

  const contactos = await obtenerContactosChat();

  contenedor.innerHTML = "";

  if (!contactos.length) {
    contenedor.innerHTML = `
      <p class="chat-empty-text">No tienes contactos disponibles para chatear.</p>
    `;
    return;
  }

  contactos.forEach((usuario) => {
    const avatar = usuario.profilePhoto || "./assets/Logo/UFGPerfil.jpg";
    const username = usuario.username ? `@${usuario.username}` : "";

    const item = document.createElement("div");
    item.className = "chat-contact-item burbuja-perfil";

    item.innerHTML = `
      <img class="chat-contact-photo burbuja" src="${avatar}" alt="Foto de perfil">

      <div class="chat-contact-info nombre-usuario">
        <strong>${escapeHtml(usuario.name || "Usuario")}</strong>
      </div>
    `;

    item.addEventListener("click", () => {
      abrirChatConUsuario(
        usuario.id,
        usuario.name,
        usuario.username,
        usuario.profilePhoto,
      );
    });

    contenedor.appendChild(item);
  });
}

async function puedeChatearCon(receiverId) {
  const senderId = getAuthUserId();

  if (!senderId || !receiverId) {
    console.error("IDs inválidos para validar chat:", { senderId, receiverId });
    return false;
  }

  const response = await fetchAuth(
    `${API_BASE}/chat/can-chat/${senderId}/${receiverId}`,
    {
      method: "GET",
      headers: getAuthHeadersSafe({ Accept: "application/json" }),
    },
  );

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => "") : "";
    console.error(
      "Error validando permiso de chat:",
      response ? response.status : "sin respuesta",
      errorText,
    );
    return false;
  }

  return await response.json();
}

async function abrirChatConUsuario(userId, name, username, profilePhoto) {
  const myId = getAuthUserId();

  if (!myId) {
    alert("No se pudo obtener el usuario autenticado.");
    return;
  }

  const can = await puedeChatearCon(userId);

  if (!can) {
    alert("Solo puedes chatear con usuarios con seguimiento mutuo.");
    return;
  }

  const chatHeader = document.getElementById("chatHeader");
  const chatEmpty = document.getElementById("chatEmpty");
  const chatWindow = document.getElementById("chatWindow");
  const chatReceiverPhoto = document.getElementById("chatReceiverPhoto");
  const chatReceiverName = document.getElementById("chatReceiverName");
  const chatReceiverUsername = document.getElementById("chatReceiverUsername");
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatMessageInput");

  if (!chatMessages || !chatForm || !chatInput) {
    console.error("Faltan elementos del DOM para abrir chat");
    return;
  }

  const chatId = generarChatId(myId, userId);

  currentChat.chatId = chatId;
  currentChat.receiverId = Number(userId);
  currentChat.myId = Number(myId);

  if (chatEmpty) chatEmpty.style.display = "none";
  if (chatWindow) chatWindow.style.display = "flex";
  if (chatHeader) chatHeader.style.display = "flex";
  if (chatForm) chatForm.style.display = "flex";

  if (chatReceiverPhoto) {
    chatReceiverPhoto.src = profilePhoto || "./assets/Logo/UFGPerfil.jpg";
  }

  if (chatReceiverName) {
    chatReceiverName.textContent = name || "Usuario";
  }

  // No mostramos el username con @, solo el nombre en la cabecera

  chatMessages.innerHTML = "";

  await crearOActualizarChat(chatId, myId, userId);

  escucharMensajesFirebase(chatId);
}

async function crearOActualizarChat(chatId, senderId, receiverId) {
  await setDoc(
    doc(db, "chats", chatId),
    {
      members: [Number(senderId), Number(receiverId)],
      memberKeys: [String(senderId), String(receiverId)],
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function escucharMensajesFirebase(chatId) {
  const chatMessages = document.getElementById("chatMessages");

  if (!chatMessages) {
    console.error("No existe #chatMessages");
    return;
  }

  if (currentChat.unsubscribe) {
    currentChat.unsubscribe();
    currentChat.unsubscribe = null;
  }

  const mensajesRef = collection(db, "chats", chatId, "messages");
  const q = query(mensajesRef, orderBy("createdAt", "asc"));

  currentChat.unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      chatMessages.innerHTML = "";

      snapshot.forEach((docSnap) => {
        const msg = {
          id: docSnap.id,
          ...docSnap.data(),
        };

        appendMensajeEnUI(
          msg,
          Number(msg.senderId) === Number(currentChat.myId),
        );
      });

      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    (error) => {
      console.error("Error escuchando mensajes de Firebase:", error);
    },
  );
}

async function enviarMensajeFirebase(chatId, mensaje) {
  if (!chatId || !mensaje || !mensaje.text) return;

  const senderId = Number(mensaje.senderId);
  const receiverId = Number(currentChat.receiverId);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    receiverId,
    text: mensaje.text,
    read: false,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: mensaje.text,
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
  });
}

function initSendListener() {
  if (_sendListenerAttached) return;

  const sendBtn = document.getElementById("chatSendBtn");
  const chatInput = document.getElementById("chatMessageInput");

  if (!sendBtn || !chatInput) return;

  sendBtn.addEventListener("click", async () => {
    const texto = chatInput.value.trim();

    if (!texto) return;

    const { chatId, receiverId, myId } = currentChat;

    if (!chatId || !receiverId || !myId) {
      console.warn("No hay chat activo");
      return;
    }

    const allow = await puedeChatearCon(receiverId);

    if (!allow) {
      alert("Solo puedes chatear con usuarios con seguimiento mutuo.");
      return;
    }

    await enviarMensajeFirebase(chatId, {
      text: texto,
      senderId: myId,
    });

    chatInput.value = "";
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });

  _sendListenerAttached = true;
}

function appendMensajeEnUI(msg, esPropio = false) {
  const chatMessages = document.getElementById("chatMessages");

  if (!chatMessages) return;

  const div = document.createElement("div");

  div.className = esPropio
    ? "mensaje-bubble mensaje-bubble--self"
    : "mensaje-bubble";

  div.textContent = msg.text || "";

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function cerrarChatActual() {
  if (currentChat.unsubscribe) {
    currentChat.unsubscribe();
    currentChat.unsubscribe = null;
  }

  currentChat.chatId = null;
  currentChat.receiverId = null;
  currentChat.myId = null;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initSendListener();

  if (document.getElementById("chatContactsList")) {
    renderizarContactosChat();
  }
});

window.abrirChatConUsuario = abrirChatConUsuario;
window.cerrarChatActual = cerrarChatActual;
window.enviarMensajeFirebase = enviarMensajeFirebase;
window.escucharMensajesFirebase = escucharMensajesFirebase;
window.renderizarContactosChat = renderizarContactosChat;

export {
  obtenerContactosChat,
  renderizarContactosChat,
  abrirChatConUsuario,
  puedeChatearCon,
  enviarMensajeFirebase,
  escucharMensajesFirebase,
};
