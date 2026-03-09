/**
 * =====================================================
 * TopDesigns.jsx
 *
 * Shows voted jersey designs with images
 * ✔ Shows ALL designs with votes > 0
 * ✔ Sorted highest votes first
 * ✔ Displays voter names
 * ✔ Does NOT affect voting limit logic
 * =====================================================
 */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";

import {
  getStorage,
  ref,
  getDownloadURL
} from "firebase/storage";

import { db } from "../services/firebase";

function TopDesigns() {

  const [designs, setDesigns] = useState([]);
  const storage = getStorage();

  useEffect(() => {

    const q = query(
      collection(db, "jerseyVotes"),
      orderBy("votes", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snap) => {

      const results = await Promise.all(

        snap.docs.map(async (d) => {

          const data = d.data();

          if (!data.votes || data.votes <= 0) return null;

          try {

            const url = await getDownloadURL(
              ref(storage, `jersey-designs/${d.id}`)
            );

            return {
              id: d.id,
              votes: data.votes,
              voters: data.voters || [],
              url
            };

          } catch {

            return null;

          }

        })

      );

      setDesigns(results.filter(Boolean));

    });

    return () => unsubscribe();

  }, []);


  if (designs.length === 0) {

    return (

      <div style={emptyBox}>

        <h3>No votes yet</h3>

        <p>
          Please vote a few jersey designs
          to see the most popular ones.
        </p>

      </div>

    );

  }

  return (

    <div style={grid}>

      {designs.map(d => (

        <div
          key={d.id}
          style={card}
          title={`Voted by: ${d.voters.join(", ")}`}
        >

          <img
            src={d.url}
            alt={d.id}
            style={image}
          />

          <p style={name}>{d.id}</p>

          <p style={votes}>❤️ {d.votes}</p>

          {d.voters.length > 0 && (
            <div style={voters}>
              {d.voters.join(", ")}
            </div>
          )}

        </div>

      ))}

    </div>

  );

}

export default TopDesigns;


/* ================= Styles ================= */

const grid = {
  display: "flex",
  gap: "15px",
  flexWrap: "wrap"
};

const card = {
  width: "140px",
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "10px",
  textAlign: "center",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
};

const image = {
  width: "100%",
  height: "100px",
  objectFit: "contain"
};

const name = {
  fontSize: "11px",
  marginTop: "6px"
};

const votes = {
  color: "#e11d48",
  fontWeight: "600"
};

const voters = {
  fontSize: "10px",
  color: "#666",
  marginTop: "4px"
};

const emptyBox = {
  textAlign: "center",
  padding: "30px",
  color: "#777"
};