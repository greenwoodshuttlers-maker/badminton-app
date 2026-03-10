import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

function SizeSummary() {

  const [sizes, setSizes] = useState({
    S: 0,
    M: 0,
    L: 0,
    XL: 0
  });

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "playerPreferences"),
      (snap) => {

        const counts = { S: 0, M: 0, L: 0, XL: 0 };

        snap.docs.forEach(d => {
          const size = d.data().size;
          if (counts[size] != null) {
            counts[size]++;
          }
        });

        setSizes(counts);

      }
    );

    return () => unsub();

  }, []);

  return (

    <div style={grid}>

      {Object.entries(sizes).map(([k, v]) => (
        <div key={k} style={box}>
          <b>{k}</b>
          <div>{v}</div>
        </div>
      ))}

    </div>

  );

}

export default SizeSummary;


/* ===================== Styles ===================== */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
  gap: "12px",
  width: "100%",
  marginTop: "10px"
};

const box = {
  padding: "12px",
  background: "#f1f5f9",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "600"
};