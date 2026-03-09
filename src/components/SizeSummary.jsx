import { useEffect, useState } from "react";
import { collection,onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

function SizeSummary(){

  const [sizes,setSizes] = useState({
    S:0,M:0,L:0,XL:0
  });

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"playerPreferences"),
      (snap)=>{

        const counts={S:0,M:0,L:0,XL:0};

        snap.docs.forEach(d=>{
          const size=d.data().size;
          if(counts[size]!=null){
            counts[size]++;
          }
        });

        setSizes(counts);

      }
    );

    return ()=>unsub();

  },[]);

  return(

    <div style={{display:"flex",gap:"15px"}}>

      {Object.entries(sizes).map(([k,v])=>(
        <div key={k} style={box}>
          <b>{k}</b>
          <div>{v}</div>
        </div>
      ))}

    </div>

  );

}

export default SizeSummary;

const box={
  padding:"12px",
  background:"#f1f5f9",
  borderRadius:"8px",
  minWidth:"60px",
  textAlign:"center"
};