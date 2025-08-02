import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, initializeAuth, indexedDBLocalPersistence } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// --- Your Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyABKvAAUxoyzvcjCXaSbwZzT0RCI32-vRQ",
    authDomain: "facturadorweb-5125f.firebaseapp.com",
    projectId: "facturadorweb-5125f",
    storageBucket: "facturadorweb-5125f.firebasestorage.app",
    messagingSenderId: "622762316446",
    appId: "1:622762316446:web:1625bc78893e674188a18f"
};

// --- Admin User IDs ---
const ADMIN_UIDS = ["w7VT3eANXZNswsQi2xoiM2r7bJh2", "q8ZHZaTN7ZfvQYJxRgBgI2v3cU22"];

// --- Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const adminAuth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const notificationForm = document.getElementById('notification-form');
const sentNotificationsList = document.getElementById('sent-notifications-list');

// --- Auth Logic ---
onAuthStateChanged(adminAuth, (user) => {
    if (user) {
        if (ADMIN_UIDS.includes(user.uid)) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadSentNotifications();
        } else {
            loginContainer.innerHTML = '<h1>Access Denied</h1><p>You do not have permission to access this panel.</p>';
            signOut(adminAuth);
        }
    } else {
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

loginButton.addEventListener('click', () => signInWithPopup(adminAuth, googleProvider));
logoutButton.addEventListener('click', () => signOut(adminAuth));

// --- Notification Logic ---
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
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});

function loadSentNotifications() {
    const q = query(collection(db, "system_notifications"), orderBy("createdAt", "desc"));
    onSnapshot(q, (querySnapshot) => {
        sentNotificationsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const notif = doc.data();
            const li = document.createElement('li');
            const date = notif.createdAt?.toDate().toLocaleString('es-CO') || 'Sending...';
            li.innerHTML = `<strong>${notif.title}</strong><p>${notif.description}</p><small>${date}</small>`;
            sentNotificationsList.appendChild(li);
        });
    });
}
