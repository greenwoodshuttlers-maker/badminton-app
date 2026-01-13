import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import { votingService } from "../services/votingService";
import LiveVotingDashboard from "../components/layout/LiveVotingDashboard";

export default function VotingPage({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [voted, setVoted] = useState(false);

  // 🔹 TEMP session object (SAFE, no Firestore yet)
  const mockSession = {
    id: "temp-session",
    votingActive: true,
    status: "live",
    roleMessage: "Vote for today's game",
  };

  useEffect(() => {
    setCandidates(votingService.getCandidates());
    setVoted(votingService.hasVoted(user.username));
  }, [user]);

  const handleVote = (name) => {
    votingService.vote(user.username, name);
    alert("Vote submitted!");
    setVoted(true);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Player of the Day
      </Typography>

      {/* 🔒 EXISTING WORKING UI — NOT REMOVED */}
      {voted ? (
        <Typography>You already voted today!</Typography>
      ) : (
        <List>
          {candidates.map((c) => (
            <ListItem button key={c} onClick={() => handleVote(c)}>
              <ListItemText primary={c} />
            </ListItem>
          ))}
        </List>
      )}

      {/* 🆕 NEW LIVE DASHBOARD (TEMP WIRED) */}
      <Box sx={{ mt: 4 }}>
        <LiveVotingDashboard session={mockSession} />
      </Box>
    </Box>
  );
}
