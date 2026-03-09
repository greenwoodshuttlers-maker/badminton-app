import { useState } from "react";
import { db } from "../services/firebase";
import { doc,setDoc } from "firebase/firestore";

function JerseyOrder({userId}){

const [jerseys,setJerseys] = useState([
 {size:"M",type:"Collar",name:"",number:"",price:450}
]);

const addJersey = ()=>{

setJerseys([
...jerseys,
{size:"M",type:"Collar",name:"",number:"",price:450}
]);

};

const updateField = (index,field,value)=>{

const updated=[...jerseys];
updated[index][field]=value;

setJerseys(updated);

};

const total = jerseys.reduce((s,j)=>s+j.price,0);

const submitOrder = async ()=>{

await setDoc(doc(db,"jerseyOrders",userId),{
 jerseys: jerseys,
 total: total
});

alert("Order saved");

};

return(

<div>

<h2>Order Jersey</h2>

{jerseys.map((j,index)=>(

<div key={index} style={{border:"1px solid #ccc",padding:"10px"}}>

<h4>Jersey {index+1}</h4>

<select
value={j.size}
onChange={(e)=>updateField(index,"size",e.target.value)}
>

<option>S</option>
<option>M</option>
<option>L</option>
<option>XL</option>

</select>

<select
value={j.type}
onChange={(e)=>updateField(index,"type",e.target.value)}
>

<option>Collar</option>
<option>Round Neck</option>

</select>

<input
placeholder="Name"
value={j.name}
onChange={(e)=>updateField(index,"name",e.target.value)}
/>

<input
placeholder="Number / Tagline"
value={j.number}
onChange={(e)=>updateField(index,"number",e.target.value)}
/>

<p>Price: ₹{j.price}</p>

</div>

))}

<button onClick={addJersey}>
+ Add Jersey
</button>

<h3>Total: ₹{total}</h3>

<button onClick={submitOrder}>
Submit Order
</button>

</div>

);

}

export default JerseyOrder;