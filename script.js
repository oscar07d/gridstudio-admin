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

// --- ID DE USUARIO ADMINISTRADOR (YA INSERTADO) ---
const ADMIN_UID = "w7VT3eANXZNswsQi2xoiM2r7bJh2";

// --- Inicialización ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Elementos del DOM ---
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const notificationForm = document.getElementById('notification-form');
const sentNotificationsList = document.getElementById('sent-notifications-list');

// --- Lógica de Autenticación y Seguridad ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si el UID del usuario NO es el del admin, bloquea el acceso.
        if (user.uid !== ADMIN_UID) {
            loginContainer.innerHTML = '<h1>Acceso Denegado</h1><p>No tienes permiso para acceder a este panel.</p>';
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
            signOut(auth); // Cierra la sesión
            return;
        }
        // Si es el admin, muestra el panel.
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        loadSentNotifications();
    } else {
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

loginButton.addEventListener('click', () => signInWithPopup(auth, googleProvider));
logoutButton.addEventListener('click', () => signOut(auth));

// --- Lógica para Enviar y Mostrar Notificaciones ---
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notification-title').value;
    const description = document.getElementById('notification-desc').value;

    try {
        await addDoc(collection(db, "system_notifications"), {
            title: title,
            description: description,
            createdAt: serverTimestamp()
        });
        notificationForm.reset();
        alert("¡Notificación enviada con éxito!");
    } catch (error) {
        console.error("Error al enviar notificación:", error);
        alert("Error al enviar notificación.");
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
