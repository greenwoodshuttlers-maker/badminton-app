import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";
import { db } from "../services/firebase";

/* =========================================================
   GET ALL VOTING SESSIONS
   Reads from: voting_sessions (top-level collection)
   ========================================================= */
export const getAllSessions = async () => {
  const q = query(
    collection(db, "voting_sessions"),
    orderBy("startTime", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,          // <-- THIS is the sessionId
    ...doc.data()
  }));
};

/* =========================================================
   GET VOTES FOR A SINGLE SESSION
   Reads from: voting_sessions/{sessionId}/votes
   NO collectionGroup
   NO sessionId field required
   ========================================================= */
export const getSessionVotes = async (sessionId) => {
  const votesRef = collection(
    db,
    "voting_sessions",
    sessionId,
    "votes"
  );

  const snap = await getDocs(votesRef);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
