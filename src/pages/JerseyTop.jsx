import { useEffect,useState } from "react";
import { db } from "../services/firebase";
import { collection,query,orderBy,limit,getDocs } from "firebase/firestore";

function JerseyTop(){

const [designs,setDesigns]=useState([]);

useEffect(async ()=>{

const q = query(
collection(db,"jerseyVotes"),
orderBy("votes","desc"),
limit(5)
);

const snap = await getDocs(q);

setDesigns(
snap.docs.map(d=>({
id:d.id,
...d.data()
}))
);

},[]);

return(

<div>

<h2>Top 5 Jerseys</h2>

{designs.map((d,i)=>(

<p key={i}>
#{i+1} {d.id} — {d.votes} votes
</p>

))}

</div>

)

}

export default JerseyTop;