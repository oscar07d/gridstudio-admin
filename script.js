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

const ADMIN_UIDS = ["w7VT3eANXZNswsQi2xoiM2r7bJh2", "q8ZHZaTN7ZfvQYJxRgBgI2v3cU22"];

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- ELEMENTOS DEL DOM ---
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');

const updateForm = document.getElementById('update-form');
const sentUpdatesList = document.getElementById('sent-updates-list');
const notificationForm = document.getElementById('notification-form');
const sentNotificationsList = document.getElementById('sent-notifications-list');

// --- LÓGICA DE AUTENTICACIÓN ---
onAuthStateChanged(auth, (user) => {
    if (user && ADMIN_UIDS.includes(user.uid)) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        loadSentUpdates();
        loadSentNotifications();
        setupTabs(); // Llama a la función para activar las pestañas
    } else {
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        if (user) signOut(auth);
    }
});

loginButton.addEventListener('click', () => signInWithPopup(auth, googleProvider));
logoutButton.addEventListener('click', () => signOut(auth));

// --- LÓGICA DE PESTAÑAS ---
function setupTabs() {
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
        });
    });
}

// --- LÓGICA PARA NOVEDADES (system_updates) ---
updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('update-title').value;
    const content = document.getElementById('update-content').value;
    try {
        await addDoc(collection(db, "system_updates"), { title, content, createdAt: serverTimestamp() });
        updateForm.reset();
        alert("¡Novedad publicada!");
    } catch (error) { console.error("Error al publicar novedad:", error); }
});

function loadSentUpdates() {
    const q = query(collection(db, "system_updates"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        sentUpdatesList.innerHTML = '';
        snapshot.forEach((doc) => {
            const update = doc.data();
            const li = document.createElement('li');
            const date = update.createdAt?.toDate().toLocaleString('es-CO') || '';
            li.innerHTML = `<strong>${update.title}</strong><p>${update.content.replace(/\n/g, '<br>')}</p><small>${date}</small>`;
            sentUpdatesList.appendChild(li);
        });
    });
}

// --- LÓGICA PARA NOTIFICACIONES (system_notifications) ---
notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notification-title').value;
    const description = document.getElementById('notification-desc').value;
    try {
        await addDoc(collection(db, "system_notifications"), { title, description, createdAt: serverTimestamp() });
        notificationForm.reset();
        alert("¡Notificación enviada!");
    } catch (error) { console.error("Error al enviar notificación:", error); }
});

function loadSentNotifications() {
    const q = query(collection(db, "system_notifications"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        sentNotificationsList.innerHTML = '';
        snapshot.forEach((doc) => {
            const notif = doc.data();
            const li = document.createElement('li');
            const date = notif.createdAt?.toDate().toLocaleString('es-CO') || '';
            li.innerHTML = `<strong>${notif.title}</strong><p>${notif.description}</p><small>${date}</small>`;
            sentNotificationsList.appendChild(li);
        });
    });
}
