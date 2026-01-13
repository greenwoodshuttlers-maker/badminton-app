import React from "react";
import { castVote } from "../../services/votingService";

export default function VoteButton({ sessionId }) {
  return (
    <div>
      <button onClick={() => castVote(sessionId, "PLAYING")}>PLAYING</button>
      <button onClick={() => castVote(sessionId, "NOT_PLAYING")}>NOT PLAYING</button>
    </div>
  );
}
