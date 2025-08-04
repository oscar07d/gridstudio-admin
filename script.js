import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// --- TU CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyABKvAAUxoyzvcjCXaSbwZzT0RCI32-vRQ",
    authDomain: "facturadorweb-5125f.firebaseapp.com",
    projectId: "facturadorweb-5125f",
    storageBucket: "facturadorweb-5125f.firebasestorage.app",
    messagingSenderId: "622762316446",
    appId: "1:622762316446:web:1625bc78893e674188a18f",
    measurementId: "G-ETGNS3KCVP"
};

// --- ID DE USUARIO ADMINISTRADOR ---
const ADMIN_UIDS = ["w7VT3eANXZNswsQi2xoiM2r7bJh2", "q8ZHZaTN7ZfvQYJxRgBgI2v3cU22"];

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Usamos getAuth estándar
const googleProvider = new GoogleAuthProvider();

// --- ELEMENTOS DEL DOM ---
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const notificationForm = document.getElementById('notification-form');
const sentNotificationsList = document.getElementById('sent-notifications-list');

// --- LÓGICA DE AUTENTICACIÓN Y SEGURIDAD ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (ADMIN_UIDS.includes(user.uid)) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadSentNotifications();
        } else {
            loginContainer.innerHTML = '<h1>Acceso Denegado</h1><p>No tienes permiso para acceder a este panel.</p>';
            signOut(auth);
        }
    } else {
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

loginButton.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider).catch(error => console.error("Error en signInWithPopup:", error));
});
logoutButton.addEventListener('click', () => signOut(auth));

// --- LÓGICA PARA ENVIAR Y MOSTRAR NOTIFICACIONES ---
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notification-title').value;
    const description = document.getElementById('notification-desc').value;

    if (!title || !description) {
        alert("Por favor, completa ambos campos.");
        return;
    }

    try {
        await addDoc(collection(db, "system_updates"), {
            title: title,
            description: description,
            createdAt: serverTimestamp()
        });
        notificationForm.reset();
    } catch (error) {
        console.error("Error al enviar notificación:", error);
    }
});

function loadSentNotifications() {
    const q = query(collection(db, "system_notifications"), orderBy("createdAt", "desc"));
    onSnapshot(q, (querySnapshot) => {
        sentNotificationsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const notif = doc.data();
            const li = document.createElement('li');
            const date = notif.createdAt?.toDate().toLocaleString('es-CO') || 'Enviando...';
            li.innerHTML = `<strong>${notif.title}</strong><p>${notif.description}</p><small>${date}</small>`;
            sentNotificationsList.appendChild(li);
        });
    });
}

