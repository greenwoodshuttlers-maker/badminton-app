/**
 * =====================================================
 * DesignCard.jsx
 *
 * Modern Jersey Design Voting Card
 *
 * Features
 * ✔ Responsive card layout
 * ✔ Green highlight for selected
 * ✔ Live vote count
 * ✔ Hover shows voter names
 * ✔ Mobile friendly UI
 * ✔ Uses nickname from profile (fallback to first name)
 * =====================================================
 */

import { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  increment,
  onSnapshot,
  arrayUnion,
  getDoc
} from "firebase/firestore";

import { db } from "../services/firebase";

export default function DesignCard({
  designId,
  imageUrl,
  selected,
  setSelected,
  userId,
  userName
}) {

  const [votes, setVotes] = useState(0);
  const [voters, setVoters] = useState([]);

  const isSelected = selected.find(d => d.id === designId);

  /**
   * Listen for vote updates
   */

  useEffect(() => {

    const ref = doc(db, "jerseyVotes", designId);

    const unsub = onSnapshot(ref, (snap) => {

      if (!snap.exists()) return;

      setVotes(snap.data().votes || 0);
      setVoters(snap.data().voters || []);

    });

    return () => unsub();

  }, [designId]);


  /**
   * Vote action
   */

  const vote = async () => {

    if (!userId) {
      alert("User not loaded");
      return;
    }

    if (selected.length >= 5) {
      alert("Maximum 5 votes allowed");
      return;
    }

    if (isSelected) return;

    /**
     * Get nickname from profile
     */

    let displayName = userName;

    try {

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {

        const profile =
          userSnap.data()?.profile;

        if (
          profile?.nickname &&
          profile.nickname.trim() !== ""
        ) {

          displayName =
            profile.nickname.trim();

        } else {

          displayName =
            userName.split(" ")[0];

        }

      }

    } catch (err) {

      displayName =
        userName.split(" ")[0];

    }


    /**
     * Update vote
     */

    const voteRef =
      doc(db, "jerseyVotes", designId);

    await setDoc(
      voteRef,
      {
        votes: increment(1),
        voters: arrayUnion(displayName)
      },
      { merge: true }
    );


    /**
     * Save user's selected designs
     */

    const userVoteRef =
      doc(db, "userVotes", userId);

    await setDoc(
      userVoteRef,
      {
        designs: arrayUnion(designId)
      },
      { merge: true }
    );


    /**
     * Update local UI
     */

    setSelected([
      ...selected,
      { id: designId, url: imageUrl }
    ]);

  };


  return (

    <div style={card(isSelected)}>

      <img
        src={imageUrl}
        alt={designId}
        style={image}
      />

      <div style={name}>
        {designId}
      </div>

      <div
        style={voteCount}
        title={voters.join(", ")}
      >
        ❤️ {votes}
      </div>

      <button
        onClick={vote}
        disabled={isSelected}
        style={voteButton(isSelected)}
      >
        {isSelected ? "Selected" : "Vote"}
      </button>

    </div>

  );

}


/* ===============================
   MODERN UI STYLES
================================ */

const card = (selected) => ({
  border: selected
    ? "2px solid #22c55e"
    : "1px solid #e5e7eb",

  borderRadius: "14px",
  padding: "12px",
  textAlign: "center",
  background: "#ffffff",

  boxShadow: selected
    ? "0 6px 18px rgba(34,197,94,0.35)"
    : "0 2px 8px rgba(0,0,0,0.08)",

  transition: "all 0.25s ease",
});

const image = {
  width: "100%",
  height: "120px",
  objectFit: "contain",
  borderRadius: "10px"
};

const name = {
  fontSize: "12px",
  marginTop: "6px",
  fontWeight: 500,
  color: "#374151",
  wordBreak: "break-word"
};

const voteCount = {
  fontSize: "13px",
  marginTop: "4px",
  color: "#ef4444",
  fontWeight: 600
};

const voteButton = (selected) => ({
  marginTop: "8px",
  padding: "7px 12px",
  borderRadius: "8px",
  border: "none",
  background: selected
    ? "#22c55e"
    : "linear-gradient(135deg,#2563eb,#3b82f6)",

  color: "white",
  cursor: selected ? "default" : "pointer",
  fontSize: "13px",
  fontWeight: 500
});