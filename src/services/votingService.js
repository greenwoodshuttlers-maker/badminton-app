import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "../services/firebase";

/* ================= START SESSION ================= */
export const startVotingSession = async (endTime, user, title, eventDate) => {
  const now = new Date();

  return await addDoc(collection(db, "voting_sessions"), {
    title,
    eventDate,
    status: "OPEN",
    archived: false,

    // ✅ immediate + reliable
    createdAt: now,

    // ✅ server authoritative
    startTime: serverTimestamp(),

    endTime,
    createdBy: user.uid,
    manualEnd: false
  });
};

/* ================= END SESSION ================= */
export const endVotingSession = async (sessionId) => {
  if (!sessionId) return;

  const sessionRef = doc(db, "voting_sessions", sessionId);

  // 1️⃣ Get all votes
  const votesSnap = await getDocs(
    collection(db, "voting_sessions", sessionId, "votes")
  );

  const votes = votesSnap.docs.map(d => d.data());

  // 2️⃣ Extract PLAYING users
  const playedUserIds = votes
    .filter(v => v.vote === "PLAYING")
    .map(v => v.userId);

  // 3️⃣ Close voting + freeze attendance
  await updateDoc(sessionRef, {
    status: "CLOSED",
    attendance: {
      playedUserIds,
      markedAt: serverTimestamp()
    }
  });
};


/* ================= CAST / UPDATE VOTE ================= */
export const castVote = async (sessionId, voteValue) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  if (!["PLAYING", "NOT_PLAYING"].includes(voteValue)) {
    throw new Error("Invalid vote");
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const name = userSnap.exists()
    ? userSnap.data().name
    : user.email;

  const voteRef = doc(
    db,
    "voting_sessions",
    sessionId,
    "votes",
    user.uid
  );

  // ✅ THIS WAS MISSING
  await setDoc(
    voteRef,
    {
      userId: user.uid,
      name,
      vote: voteValue,
      votedAt: serverTimestamp() // ✅ real vote timestamp
    },
    { merge: true }
  );
};

/* ================= LISTEN SESSIONS (NO FILTER) ================= */
export const listenActiveSessions = (callback) => {
  const q = query(
    collection(db, "voting_sessions"),
    orderBy("startTime", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  });
};


/* ================= LISTEN VOTES (FULL LIST) ================= */
export const listenVotesDetailed = (sessionId, callback) => {
  const q = collection(
    db,
    "voting_sessions",
    sessionId,
    "votes"
  );

  return onSnapshot(q, (snapshot) => {
    const votes = snapshot.docs.map(d => ({
      userId: d.id,
      ...d.data()
    }));
    callback(votes);
  });
};

/* ================= GET LAST SESSION ================= */
export const getLastSession = async () => {
  const q = query(
    collection(db, "voting_sessions"),
    orderBy("startTime", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  return {
    id: snap.docs[0].id,
    ...snap.docs[0].data()
  };
};

/* ================= EXTEND SESSION ================= */
export const extendVotingSession = async (sessionId, newEndTime) => {
  await updateDoc(doc(db, "voting_sessions", sessionId), {
    endTime: newEndTime
  });
};

/* ================= REOPEN SESSION ================= */
export const reopenVotingSession = async (sessionId, newEndTime) => {
  await updateDoc(doc(db, "voting_sessions", sessionId), {
    status: "OPEN",
    archived: false,
    manualEnd: false,
    endTime: newEndTime
  });
};

/* ================= MOVE TO HISTORY ================= */
export const moveSessionToHistory = async (sessionId) => {
  await updateDoc(doc(db, "voting_sessions", sessionId), {
    archived: true
  });
};

/* ================= REOPEN FROM HISTORY ================= */
export const reopenArchivedSession = async (sessionId, newEndTime) => {
  await updateDoc(doc(db, "voting_sessions", sessionId), {
    archived: false,
    status: "OPEN",
    manualEnd: false,
    endTime: newEndTime
  });
};

/*============== SESSION BOOKING UPDATE ======================*/
export const updateSessionBooking = async (sessionId, booking) => {
  if (!sessionId) return;

  const ref = doc(db, "voting_sessions", sessionId);

  await updateDoc(ref, {
    booking: {
      ...booking,
      bookedAt: serverTimestamp()
    }
  });
};

/*============== SESSION ATTENDANCE UPDATE ======================*/
export const updateSessionAttendance = async (
  sessionId,
  playedUserIds
) => {
  if (!sessionId) return;

  const ref = doc(db, "voting_sessions", sessionId);

  await updateDoc(ref, {
    attendance: {
      playedUserIds,
      markedAt: serverTimestamp()
    }
  });
};

