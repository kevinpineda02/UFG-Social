// firebaseConfig.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDF7twsuUhcPaZysOToqB9Annglih-cdTg",
  authDomain: "chat-en-tiempo-real-64207.firebaseapp.com",
  projectId: "chat-en-tiempo-real-64207",
  storageBucket: "chat-en-tiempo-real-64207.firebasestorage.app",
  messagingSenderId: "928173908621",
  appId: "1:928173908621:web:cb803084bdcdaefbf438c4",
  measurementId: "G-D3TV5EWJ61"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);