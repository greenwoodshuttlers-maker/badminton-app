import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc
} from "firebase/firestore";

export default function ActiveVoting({ session }) {
  const [votes, setVotes] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const user = auth.currentUser;

  // 🔹 Load all active users
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setAllUsers(list);
    };
    loadUsers();
  }, []);

  // 🔹 Listen to votes in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "voting_sessions", session.id, "votes"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach(doc => {
          map[doc.id] = doc.data();
        });
        setVotes(map);
      }
    );
    return () => unsub();
  }, [session.id]);

  // 🔹 Cast Vote
  const vote = async (choice) => {
    if (!user) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const name = userSnap.data().name;

    await setDoc(
      doc(db, "voting_sessions", session.id, "votes", user.uid),
      {
        userId: user.uid,
        userName: name,
        choice
      }
    );
  };

  // 🔹 Helpers
  const hasVoted = votes[user?.uid];
  const playList = [];
  const notPlayList = [];

  allUsers.forEach(u => {
    if (votes[u.id]?.choice === "PLAY") {
      playList.push(u.name);
    } else {
      notPlayList.push(u.name); // default NOT PLAY
    }
  });

  return (
    <div style={{ border: "1px solid #ccc", padding: 15, marginTop: 20 }}>
      <h3>{session.title}</h3>
      <p>Status: {session.status}</p>

      {session.status === "OPEN" && !hasVoted && (
        <>
          <button onClick={() => vote("PLAY")}>I will play</button>
          <button onClick={() => vote("NOT_PLAY")} style={{ marginLeft: 10 }}>
            I will not play
          </button>
        </>
      )}

      {hasVoted && (
        <p>
          ✅ You voted:{" "}
          <b>{hasVoted.choice === "PLAY" ? "I will play" : "I will not play"}</b>
        </p>
      )}

      <hr />

      <h4>🏸 I will play ({playList.length})</h4>
      <ul>
        {playList.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <h4>❌ I will not play ({notPlayList.length})</h4>
      <ul>
        {notPlayList.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
