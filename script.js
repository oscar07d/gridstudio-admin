import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
        initializeVisibilityOptions();
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

function initializeVisibilityOptions() {
    // Para el formulario de Novedades
    flatpickr("#update-expires-at", { enableTime: true, dateFormat: "Y-m-d H:i" });
    document.querySelectorAll('input[name="update-visibility"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('update-expires-at').disabled = (e.target.value !== 'expires');
        });
    });
    // Para el formulario de Notificaciones
    flatpickr("#notif-expires-at", { enableTime: true, dateFormat: "Y-m-d H:i" });
    document.querySelectorAll('input[name="notif-visibility"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('notif-expires-at').disabled = (e.target.value !== 'expires');
        });
    });
}

// --- LÓGICA PARA ENVIAR NOVEDADES (ACTUALIZADA) ---
updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('update-title').value;
    const content = document.getElementById('update-content').value;
    
    // Obtener opciones de visibilidad
    const visibility = document.querySelector('input[name="update-visibility"]:checked').value;
    const expiresAtInput = document.getElementById('update-expires-at').value;
    const expiresAt = (visibility === 'expires' && expiresAtInput) ? Timestamp.fromDate(new Date(expiresAtInput)) : null;

    try {
        await addDoc(collection(db, "system_updates"), { title, content, createdAt: serverTimestamp(), expiresAt });
        updateForm.reset();
        alert("¡Novedad publicada!");
    } catch (error) { console.error("Error al publicar novedad:", error); }
});

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
        const sentNotificationsList = document.getElementById('sent-notifications-list');
        sentNotificationsList.innerHTML = ''; // Limpia la lista antes de volver a dibujarla

        snapshot.forEach((docSnap) => {
            const notif = docSnap.data();
            const li = document.createElement('li');
            
            const date = notif.createdAt?.toDate().toLocaleString('es-CO') || 'Enviando...';

            // Construye el HTML interno del elemento de la lista
            li.innerHTML = `
                <strong>${notif.title || '(Sin título)'}</strong>
                <p>${notif.description || '(Sin contenido)'}</p>
                <small>${date}</small>
            `;
            
            // --- CÓDIGO AÑADIDO ---
            // Crea y añade el botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.onclick = async () => {
                if (confirm(`¿Estás seguro de que deseas eliminar la notificación "${notif.title}"?`)) {
                    await deleteDoc(doc(db, "system_notifications", docSnap.id));
                }
            };

            li.appendChild(deleteBtn); // Añade el botón al final del <li>
            sentNotificationsList.appendChild(li); // Añade el <li> completo a la lista <ul>
        });
    });
}

// --- LÓGICA PARA MOSTRAR NOVEDADES (ACTUALIZADA CON BOTÓN DE ELIMINAR) ---
function loadSentUpdates() {
    const q = query(collection(db, "system_updates"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const sentUpdatesList = document.getElementById('sent-updates-list');
        sentUpdatesList.innerHTML = ''; // Limpia la lista antes de volver a dibujarla
        
        snapshot.forEach((docSnap) => {
            const update = docSnap.data();
            const li = document.createElement('li');
            
            const date = update.createdAt?.toDate().toLocaleString('es-CO') || 'Publicado recientemente';

            // Construye el HTML interno del elemento de la lista
            li.innerHTML = `
                <strong>${update.title || '(Sin título)'}</strong>
                <p>${(update.content || '(Sin contenido)').replace(/\n/g, '<br>')}</p>
                <small>${date}</small>
            `;
            
            // Crea y añade el botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.onclick = async () => {
                if (confirm(`¿Estás seguro de que deseas eliminar la novedad "${update.title}"?`)) {
                    await deleteDoc(doc(db, "system_updates", docSnap.id));
                }
            };

            li.appendChild(deleteBtn); // Añade el botón al final del <li>
            sentUpdatesList.appendChild(li); // Añade el <li> completo a la lista <ul>
        });
    });
}


