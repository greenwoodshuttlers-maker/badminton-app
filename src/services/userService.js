import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

export const listenActiveUsers = (cb) => {
  const q = query(
    collection(db, "users"),
    where("status", "==", "ACTIVE")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(doc => {
      const d = doc.data();
      return {
        uid: doc.id,
        name: d.name,
        role: d.role,                 // ✅ REQUIRED
        profile: d.profile || {},
        isOnline: d.isOnline === true,
        lastLoginAt: d.lastLoginAt || null
      };
    });

    cb(list);
  });
};
