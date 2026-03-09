/**
 * =====================================================
 * PlayerPreferences.jsx
 *
 * Collects jersey details from players
 * - size
 * - jersey name
 * - number/tag
 * - keeps history of changes
 * =====================================================
 */

import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot
} from "firebase/firestore";

import { db } from "../services/firebase";
import { Link } from "react-router-dom";

export default function PlayerPreferences() {

  const user =
    JSON.parse(localStorage.getItem("user"));

  const [size,setSize] = useState("");
  const [name,setName] = useState("");
  const [number,setNumber] = useState("");
  const [history,setHistory] = useState([]);

  /**
   * Size Chart (Indian Sports Jersey)
   */

  const sizes = [
    {code:"S",name:"Small",chest:38,cm:96},
    {code:"M",name:"Medium",chest:40,cm:101},
    {code:"L",name:"Large",chest:42,cm:106},
    {code:"XL",name:"Extra Large",chest:44,cm:111},
    {code:"XXL",name:"Double XL",chest:46,cm:116}
  ];


  /**
   * Load last saved preference
   */

  useEffect(()=>{

    const loadPreference = async()=>{

      const ref =
        doc(db,"playerPreferences",user.id);

      const snap = await getDoc(ref);

      if(!snap.exists()) return;

      const data = snap.data();

      setSize(data.size || "");
      setName(data.jerseyName || "");
      setNumber(data.number || "");

    };

    loadPreference();

  },[]);


  /**
   * Load history records
   */

  useEffect(()=>{

    const ref =
      collection(
        db,
        "playerPreferences",
        user.id,
        "history"
      );

    const unsub = onSnapshot(ref,(snap)=>{

      const data =
        snap.docs.map(d=>d.data());

      setHistory(data);

    });

    return ()=>unsub();

  },[]);


  /**
   * Save preferences
   */

  const save = async ()=>{

    if(!size){
      alert("Please select size");
      return;
    }

    const now = new Date();

    const prefRef =
      doc(db,"playerPreferences",user.id);

    await setDoc(prefRef,{
      playerName:user.name,
      size,
      jerseyName:name,
      number,
      updatedAt:now
    });

    const historyRef =
      collection(
        db,
        "playerPreferences",
        user.id,
        "history"
      );

    await addDoc(historyRef,{
      size,
      jerseyName:name,
      number,
      savedAt:now
    });

    alert("Preferences saved successfully");

  };


  return (

    <div style={container}>

      <h2 style={title}>
        👕 Jersey Preferences
      </h2>

      <Link to="/jersey-dashboard">
        <button style={backBtn}>
          ← Back to Jersey Dashboard
        </button>
      </Link>


      {/* ========================
          Preference Card
      ======================== */}

      <div style={card}>

        <div style={field}>

          <label style={label}>
            📏 Select Size
          </label>

          <div style={sizeGrid}>

            {sizes.map(s => (

              <div
                key={s.code}
                onClick={()=>setSize(s.code)}
                style={{
                  ...sizeCard,
                  ...(size===s.code
                    ? sizeSelected
                    : {})
                }}
              >

                <div style={sizeLetter}>
                  {s.code}
                </div>

                <div style={sizeName}>
                  {s.name}
                </div>

                <div style={sizeChest}>
                  Chest {s.chest}" ({s.cm}cm)
                </div>

              </div>

            ))}

          </div>

        </div>


        <div style={field}>

          <label style={label}>
            🏷 Name on Jersey
          </label>

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Example: SHASHANK"
            style={input}
          />

        </div>


        <div style={field}>

          <label style={label}>
            🔢 Number / Tagline
          </label>

          <input
            value={number}
            onChange={(e)=>setNumber(e.target.value)}
            placeholder="Example: 07 or Coach"
            style={input}
          />

        </div>


        <button
          onClick={save}
          style={saveBtn}
        >
          Save Preferences
        </button>

      </div>


      {/* ========================
          History Section
      ======================== */}

      <h3 style={historyTitle}>
        📜 Preference History
      </h3>

      {history.length===0 && (

        <p style={{color:"#777"}}>
          No history yet
        </p>

      )}

      <div style={historyGrid}>

        {history.map((h,i)=>{

          const date =
            h.savedAt?.seconds
              ? new Date(
                  h.savedAt.seconds*1000
                )
              : new Date(h.savedAt);

          return(

            <div key={i} style={historyCard}>

              <div style={historyDate}>
                🕒 {date.toLocaleDateString()}
              </div>

              <div>📏 Size: {h.size}</div>
              <div>🏷 Name: {h.jerseyName}</div>
              <div>🔢 Number: {h.number}</div>

            </div>

          );

        })}

      </div>

    </div>

  );

}


/* ===========================
   Styles
=========================== */

const container={
  maxWidth:"720px",
  margin:"auto",
  padding:"20px"
};

const title={
  marginBottom:"10px"
};

const label={
  fontWeight:"600",
  marginBottom:"6px"
};

const card={
  background:"#ffffff",
  borderRadius:"14px",
  padding:"22px",
  marginTop:"15px",
  boxShadow:"0 6px 18px rgba(0,0,0,0.08)"
};

const field={
  display:"flex",
  flexDirection:"column",
  marginBottom:"16px"
};

const input={
  padding:"9px",
  borderRadius:"7px",
  border:"1px solid #ddd",
  fontSize:"14px"
};

const saveBtn={
  marginTop:"10px",
  padding:"11px",
  background:"#22c55e",
  color:"white",
  border:"none",
  borderRadius:"9px",
  cursor:"pointer",
  fontWeight:"600",
  fontSize:"14px"
};

const backBtn={
  padding:"8px 12px",
  background:"#3b82f6",
  color:"white",
  border:"none",
  borderRadius:"6px",
  cursor:"pointer"
};


/* ===== Size Cards ===== */

const sizeGrid={
  display:"grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(110px,1fr))",
  gap:"10px",
  marginTop:"8px"
};

const sizeCard={
  border:"1px solid #e5e7eb",
  borderRadius:"10px",
  padding:"10px",
  textAlign:"center",
  cursor:"pointer",
  background:"#fff",
  transition:"all 0.2s"
};

const sizeSelected={
  border:"2px solid #22c55e",
  background:"#f0fdf4"
};

const sizeLetter={
  fontSize:"18px",
  fontWeight:"700"
};

const sizeName={
  fontSize:"13px",
  color:"#555"
};

const sizeChest={
  fontSize:"11px",
  color:"#888"
};


/* ===== History Cards ===== */

const historyTitle={
  marginTop:"30px"
};

const historyGrid={
  display:"flex",
  flexWrap:"wrap",
  gap:"12px",
  marginTop:"10px"
};

const historyCard={
  background:"#f8fafc",
  padding:"12px",
  borderRadius:"10px",
  border:"1px solid #e5e7eb",
  minWidth:"160px"
};

const historyDate={
  fontWeight:"600",
  marginBottom:"6px"
};