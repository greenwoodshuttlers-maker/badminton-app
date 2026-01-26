import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

/* ================= ADD BREAKFAST EXPENSE ================= */
export const addBreakfastExpense = async (data) => {
  await addDoc(collection(db, "club_expenses"), {
    ...data,
    type: "BREAKFAST",
    createdAt: serverTimestamp()
  });
};

/* ================= LIST BREAKFAST EXPENSES ================= */
export const getBreakfastExpenses = async () => {
  const q = query(
    collection(db, "club_expenses"),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.type === "BREAKFAST");
};
