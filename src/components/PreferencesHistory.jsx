import { useEffect,useState } from "react";
import { collection,onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

function PreferencesHistory({userId}){

  const [history,setHistory] = useState([]);

  useEffect(()=>{

    const ref = collection(db,"playerPreferences",userId,"history");

    const unsub = onSnapshot(ref,(snap)=>{

      const data = snap.docs.map(d=>d.data());

      setHistory(data);

    });

    return ()=>unsub();

  },[]);

  return(

    <div style={{marginTop:"10px"}}>

      {history.map((h,i)=>(
        <div key={i} style={box}>

          Saved on {new Date(h.savedAt.seconds*1000).toLocaleDateString()}

          <div>Size: {h.size}</div>
          <div>Name: {h.jerseyName}</div>
          <div>Number: {h.number}</div>

        </div>
      ))}

    </div>

  );

}

export default PreferencesHistory;

const box={
  padding:"10px",
  border:"1px solid #eee",
  borderRadius:"8px",
  marginBottom:"8px"
};