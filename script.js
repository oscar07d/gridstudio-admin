// Importa módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase (proyecto: gridstudio-admin-panel)
const firebaseConfig = {
  apiKey: "	AIzaSyBGPrWHlcIvqNfREIGdPIbUJg8lk2O0n2k",
  authDomain: "gridstudio-admin-panel.firebaseapp.com",
  projectId: "gridstudio-admin-panel",
  storageBucket: "gridstudio-admin-panel.firebasestorage.app",
  messagingSenderId: "482843610158",
  appId: "1:482843610158:web:ae23f1c7eab09cf05ae3bf",
  measurementId: "G-PSK069PWTF"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
async function isUserAdmin(email) {
  const docRef = doc(db, "admins", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

async function loadSystemAlerts() {
  try {
    const alertsRef = collection(db, "systemAlerts");
    const snapshot = await getDocs(alertsRef);

    snapshot.forEach(doc => {
      const alert = doc.data();
      console.log("?? Alerta cargada:", alert.message);

      // Aqu� puedes mostrarlo en HTML (ej. un banner)
      const alertContainer = document.getElementById("alertContainer");
      if (alertContainer) {
        const div = document.createElement("div");
        div.className = "alert-banner";
        div.textContent = alert.message;
        alertContainer.appendChild(div);
      }
    });

  } catch (error) {
    console.error("? Error al cargar alertas:", error.message);
  }
}

// =================== FUNCIÓN DE LOGIN CON GOOGLE =================== //

const btnGoogle = document.getElementById("btnGoogleLogin");
if (btnGoogle) {
  btnGoogle.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("✅ Usuario autenticado:", user.email);

      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          role: "admin",
          createdAt: new Date().toISOString()
        });
        console.log("📝 Nuevo admin registrado en Firestore.");
      }

      // Redirigir al Dashboard
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("❌ Error al iniciar sesión con Google:", error.message);
    }
  });
}

// =================== OBSERVADOR DE SESIÓN =================== //

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("?? Sesi�n activa:", user.email);

    const esAdmin = await isUserAdmin(user.email);
    if (!esAdmin) {
      alert("? No tienes permisos para acceder a este panel.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    // Aqu� puedes dejar acceso a dashboard.html
    if (window.location.pathname.includes("dashboard.html")) {
      console.log("? Usuario con acceso confirmado al dashboard.");
      // Puedes cargar configuraci�n aqu�
      await loadSystemAlerts();
    }

  } else {
    console.log("?? No hay sesi�n iniciada.");
    if (window.location.pathname.includes("dashboard.html")) {
      window.location.href = "index.html";
    }
  }
});

// =================== CERRAR SESIÓN =================== //

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("👋 Sesión cerrada.");
      window.location.href = "index.html";
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error.message);
    }
  });
}