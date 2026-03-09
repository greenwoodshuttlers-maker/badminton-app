/**
 * =====================================================
 * PlayersPreferences.jsx
 *
 * Modern card layout for player jersey preferences
 * =====================================================
 */

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

function PlayersTable() {

  const [players, setPlayers] = useState([]);

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "playerPreferences"),
      (snap) => {

        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        setPlayers(data);

      }
    );

    return () => unsub();

  }, []);

  if (players.length === 0) {

    return (
      <p style={{color:"#777"}}>
        No player preferences submitted yet
      </p>
    );

  }

  return (

    <div style={grid}>

      {players.map((p)=>(
        
        <div key={p.id} style={card}>

          <div style={playerName}>
            👤 {p.playerName || "Player"}
          </div>

          <div style={infoRow}>
            <span style={label}>📏 Size</span>
            <span>{p.size}</span>
          </div>

          <div style={infoRow}>
            <span style={label}>🏷 Name</span>
            <span>{p.jerseyName}</span>
          </div>

          <div style={infoRow}>
            <span style={label}>🔢 Number / Tag</span>
            <span>{p.number}</span>
          </div>

        </div>

      ))}

    </div>

  );

}

export default PlayersTable;


/* =============================
   Styles
============================= */

const grid = {
  display:"flex",
  flexWrap:"wrap",
  gap:"15px",
  marginTop:"10px"
};

const card = {
  width:"200px",
  background:"#ffffff",
  borderRadius:"10px",
  padding:"12px",
  boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
  border:"1px solid #eee"
};

const playerName = {
  fontWeight:"600",
  marginBottom:"10px",
  fontSize:"14px"
};

const infoRow = {
  display:"flex",
  justifyContent:"space-between",
  fontSize:"13px",
  marginBottom:"4px"
};

const label = {
  color:"#555"
};