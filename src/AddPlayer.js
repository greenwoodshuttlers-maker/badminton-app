import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

function AddPlayer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PLAYER");
  const [message, setMessage] = useState("");

  const addPlayer = async () => {
    if (!name || !email) {
      setMessage("Name and Email are required");
      return;
    }

    await addDoc(collection(db, "pending_users"), {
      name,
      email,
      role,
      active: true,
      createdAt: serverTimestamp()
    });

    setMessage("Player added");
    setName("");
    setEmail("");
  };

  return (
    <div>
      <h3>Add Player</h3>

      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <br /><br />

      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <br /><br />

      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="PLAYER">PLAYER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <br /><br />

      <button onClick={addPlayer}>Add</button>
      <p>{message}</p>
    </div>
  );
}

export default AddPlayer;
