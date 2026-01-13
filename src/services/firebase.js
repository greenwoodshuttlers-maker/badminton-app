import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWmRwRAHHtKYzFd5z3jy3OyWHwndMk9tg",
  authDomain: "badminton-group-c1a91.firebaseapp.com",
  projectId: "badminton-group-c1a91",
  storageBucket: "badminton-group-c1a91.firebasestorage.app",
  messagingSenderId: "397067340076",
  appId: "1:397067340076:web:d63f01578855b2d13e4489"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
