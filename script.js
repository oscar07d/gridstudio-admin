// Importa mÃ³dulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ConfiguraciÃ³n de Firebase (proyecto: gridstudio-admin-panel)
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
const email = document.getElementById("inputEmail").value;
const password = document.getElementById("inputPassword").value;
const user = auth.currentUser;
const docRef = doc(db, "admins", user.uid);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  alert("⛔ No tienes permisos para acceder.");
  await signOut(auth);
  return;
}

async function isUserAdmin(uid) {
  const docRef = doc(db, "admins", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

async function loadSystemAlerts() {
  try {
    const alertsRef = collection(db, "systemAlerts");
    const snapshot = await getDocs(alertsRef);

    snapshot.forEach(doc => {
      const alert = doc.data();
      console.log("🛑 Alerta cargada:", alert.message);

      // Aquí puedes mostrarlo en HTML (ej. un banner)
      const alertContainer = document.getElementById("alertContainer");
      if (alertContainer) {
        const div = document.createElement("div");
        div.className = "alert-banner";
        div.textContent = alert.message;
        alertContainer.appendChild(div);
      }
    });

  } catch (error) {
    console.error("❌ Error al cargar alertas:", error.message);
  }
}

signInWithEmailAndPassword(auth, email, password)
  .then(userCredential => {
    const user = userCredential.user;
    console.log("✅ Inicio de sesión correcto:", user.email);
    // Redirigir al dashboard
    window.location.href = "dashboard.html";
  })
  .catch(error => {
    console.error("❌ Error al iniciar sesión:", error.message);
    alert("Correo o contraseña incorrectos.");
  });

// =================== FUNCIÃ“N DE LOGIN CON GOOGLE =================== //

const btnGoogle = document.getElementById("btnGoogleLogin");
if (btnGoogle) {
  btnGoogle.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("âœ… Usuario autenticado:", user.email);

      const adminRef = doc(db, "admins", user.email);
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
        console.log("ðŸ“ Nuevo admin registrado en Firestore.");
      }

      // Redirigir al Dashboard
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("âŒ Error al iniciar sesiÃ³n con Google:", error.message);
    }
  });
}

// =================== OBSERVADOR DE SESIÃ“N =================== //

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("🔐 Sesión activa:", user.email);

    const esAdmin = await isUserAdmin(user.uid);
    if (!esAdmin) {
      alert("⛔ No tienes permisos para acceder a este panel.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    // Aquí puedes dejar acceso a dashboard.html
    if (window.location.pathname.includes("dashboard.html")) {
      console.log("✅ Usuario con acceso confirmado al dashboard.");
      // Puedes cargar configuración aquí
      await loadSystemAlerts();
    }

  } else {
    console.log("🚫 No hay sesión iniciada.");
    if (window.location.pathname.includes("dashboard.html")) {
      window.location.href = "index.html";
    }
  }
});

// =================== CERRAR SESIÃ“N =================== //

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("ðŸ‘‹ SesiÃ³n cerrada.");
      window.location.href = "index.html";
    } catch (error) {
      console.error("âŒ Error al cerrar sesiÃ³n:", error.message);
    }
  });
}
