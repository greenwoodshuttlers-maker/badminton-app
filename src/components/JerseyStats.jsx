import { useEffect,useState } from "react";
import { collection,onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

function JerseyStats(){

  const [players,setPlayers] = useState([]);

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"playerPreferences"),
      snap=>{
        setPlayers(snap.docs.map(d=>d.data()));
      }
    );

    return ()=>unsub();

  },[]);

  const totalPlayers = players.length;

  const customNames =
    players.filter(p=>p.jerseyName).length;

  return(

    <div style={stats}>

      <div style={box}>
        👥 Players
        <div>{totalPlayers}</div>
      </div>

      <div style={box}>
        🏷 Custom Names
        <div>{customNames}</div>
      </div>

    </div>

  );

}

export default JerseyStats;

const stats={
  display:"flex",
  gap:"15px",
  marginBottom:"20px"
};

const box={
  padding:"12px",
  background:"#f1f5f9",
  borderRadius:"10px",
  minWidth:"120px",
  textAlign:"center"
};