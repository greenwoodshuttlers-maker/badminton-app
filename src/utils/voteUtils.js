import {
  doc,
  updateDoc,
  increment,
  arrayRemove
} from "firebase/firestore";

import { db } from "../services/firebase";

export async function removeVoteFromDesign(design,userId,userName){

  const voteRef = doc(db,"jerseyVotes",design.id);

  await updateDoc(voteRef,{
    votes:increment(-1),
    voters:arrayRemove(userName)
  });

  const userRef = doc(db,"userVotes",userId);

  await updateDoc(userRef,{
    designs:arrayRemove(design.id)
  });

}