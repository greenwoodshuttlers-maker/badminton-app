import { createContext, useContext, useEffect, useState } from "react";
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

  // 🔹 Listen to auth changes
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

        // 🛡️ SAFE AUTO-CREATE (ONE TIME ONLY)
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
          role: data.role, // SUPER_ADMIN | ADMIN | PLAYER
        });
      } catch (err) {
        console.error("Auth load error:", err);
        await signOut(auth);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error("Login error:", err.message);
      return false;
    }
  };

  // 🔹 Logout (IMPORTANT: mark offline)
  const logout = async () => {
    try {
      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { isOnline: false },
          { merge: true }
        );
      }

      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
