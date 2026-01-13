import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function CloseVoting({ sessionId }) {

  const closeVoting = async () => {
    try {
      await updateDoc(
        doc(db, "voting_sessions", sessionId),
        { status: "CLOSED" }
      );
      alert("Voting closed");
    } catch (e) {
      alert(e.message);
    }
  };

  return <button onClick={closeVoting}>Close Voting</button>;
}
