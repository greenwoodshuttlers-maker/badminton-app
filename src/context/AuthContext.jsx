import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⏱️ timers (important to avoid multiple timers)
  const idleTimerRef = useRef(null);

  /* =====================================================
     🔐 AUTH STATE LISTENER
  ===================================================== */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        // 🛡️ SAFE AUTO-CREATE USER (ONE TIME)
        if (!snap.exists()) {
          await setDoc(userRef, {
            name:
              firebaseUser.displayName ||
              firebaseUser.email.split("@")[0],
            email: firebaseUser.email,
            role: "PLAYER",
            status: "ACTIVE",
            createdAt: serverTimestamp(),
          });
        }

        // 🔹 UPDATE PRESENCE + LAST LOGIN
        await setDoc(
          userRef,
          {
            lastLoginAt: serverTimestamp(),
            isOnline: true,
          },
          { merge: true }
        );

        const freshSnap = await getDoc(userRef);
        const data = freshSnap.data();

        // 🚫 Block inactive users
        if (data.status !== "ACTIVE") {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name,
          role: data.role,
        });

        // 🧠 store login time (for session expiry)
        if (!localStorage.getItem("loginTime")) {
          localStorage.setItem("loginTime", Date.now());
          console.log("✅ loginTime set:", Date.now());
        }
      } catch (err) {
        console.error("Auth load error:", err);
        await signOut(auth);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* =====================================================
     ⏱️ AUTO LOGOUT SYSTEM (IDLE + SESSION EXPIRY)
  ===================================================== */
  useEffect(() => {
  if (!user) return;

  const IDLE_LIMIT = 30 * 60 * 1000; // 30 min
  const SESSION_LIMIT = 24 * 60 * 60 * 1000; //24 hours

  const logoutWithMessage = async (msg) => {
    alert(msg);
    await logout();
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      logoutWithMessage("🔒 Logged out due to inactivity.");
    }, IDLE_LIMIT);
  };

  const checkSessionExpiry = () => {
    const loginTime = Number(localStorage.getItem("loginTime"));

    console.log("⏱ Session Check:", Date.now() - loginTime);

    if (loginTime && Date.now() - loginTime > SESSION_LIMIT) {
      logoutWithMessage("🔒 Session expired. Please login again.");
    }
  };

  const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

  events.forEach(event =>
    window.addEventListener(event, resetIdleTimer)
  );

  resetIdleTimer();
  checkSessionExpiry();

  const sessionInterval = setInterval(checkSessionExpiry, 3000); // every 3 sec

  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    clearInterval(sessionInterval);

    events.forEach(event =>
      window.removeEventListener(event, resetIdleTimer)
    );
  };
}, [user]);


  /* =====================================================
     🔹 LOGIN
  ===================================================== */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error("Login error:", err.message);
      return false;
    }
  };

  /* =====================================================
     🔹 LOGOUT (IMPORTANT: mark offline)
  ===================================================== */
  const logout = async () => {
    try {
      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { isOnline: false },
          { merge: true }
        );
      }

      localStorage.removeItem("loginTime"); // 🧹 clear session time
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
