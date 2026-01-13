import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";

export default function CreateVoting() {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(10);

  const createVoting = async () => {
    const now = Timestamp.now();
    const end = Timestamp.fromMillis(
      now.toMillis() + minutes * 60 * 1000
    );

    await addDoc(collection(db, "voting_sessions"), {
      title,
      createdBy: auth.currentUser.uid,
      createdAt: now,
      startTime: now,
      endTime: end,
      status: "OPEN",
      options: ["I will play", "I will not play"]
    });

    alert("Voting created");
  };

  return (
    <div>
      <h3>Create Voting</h3>
      <input
        placeholder="Voting title"
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="number"
        placeholder="Minutes"
        onChange={(e) => setMinutes(e.target.value)}
      />
      <button onClick={createVoting}>Start Voting</button>
    </div>
  );
}
