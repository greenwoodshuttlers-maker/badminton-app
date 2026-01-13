import {
  collection,
  onSnapshot,
  getDocs
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";

export default function VotingResults({ sessionId }) {
  const [votes, setVotes] = useState([]);
  const [players, setPlayers] = useState([]);

  // Load votes
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "voting_sessions", sessionId, "votes"),
      (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        setVotes(list);
      }
    );
    return () => unsub();
  }, [sessionId]);

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(doc => doc.data());
      setPlayers(list);
    };
    loadPlayers();
  }, []);

  const votedUserIds = votes.map(v => v.userId);

  const willPlay = votes.filter(v => v.choice === "I will play");

  const willNotPlay = [
    ...votes.filter(v => v.choice === "I will not play"),
    ...players
      .filter(p => !votedUserIds.includes(p.uid))
      .map(p => ({ userName: p.name + " (not voted)" }))
  ];

  return (
    <div style={{ marginTop: 10 }}>
      <h4>Results</h4>

      <div>
        <strong>I will play ({willPlay.length})</strong>
        <ul>
          {willPlay.map(v => (
            <li key={v.userId}>{v.userName}</li>
          ))}
        </ul>
      </div>

      <div>
        <strong>I will not play ({willNotPlay.length})</strong>
        <ul>
          {willNotPlay.map((v, i) => (
            <li key={i}>{v.userName}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
