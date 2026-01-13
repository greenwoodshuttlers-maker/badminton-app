import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Chip
} from "@mui/material";
import dayjs from "dayjs";
import { auth } from "../services/firebase";
import { castVote, listenVotesDetailed } from "../services/votingService";

export default function VotingPanel({ session }) {
  const [summary, setSummary] = useState({
    playing: 0,
    notPlaying: 0,
    total: 0
  });
  const [remaining, setRemaining] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const user = auth.currentUser;

  /* ================= LIVE VOTE SUMMARY ================= */
  useEffect(() => {
    if (!session?.id || !user) return;

    const unsub = listenVotesDetailed(session.id, (votes) => {
      const playing = votes.filter(v => v.vote === "PLAYING").length;
      const notPlaying = votes.filter(v => v.vote === "NOT_PLAYING").length;

      playing(playing);
      notPlaying(notPlaying);
    });


    return () => unsub && unsub();
  }, [session, user]);

  /* ================= COUNTDOWN TIMER ================= */
  useEffect(() => {
    if (!session?.endTime) return;

    const updateTimer = () => {
      const end = dayjs(session.endTime.toDate());
      const now = dayjs();
      const diff = end.diff(now, "second");

      if (diff <= 0) {
        setRemaining("Voting Ended");
        return;
      }

      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      setRemaining(
        `${d ? d + "d " : ""}${h ? h + "h " : ""}${m ? m + "m " : ""}${s}s`
      );
    };

    updateTimer();
    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, [session]);

  /* ================= CAST VOTE ================= */
  const handleVote = async (value) => {
    if (!user || alreadyVoted || remaining === "Voting Ended") return;
    await castVote(session.id, value);
    setAlreadyVoted(true);
  };

  return (
    <Box mt={3}>
      <Typography variant="h6">Voting Active</Typography>

      <Typography color="error" mb={2}>
        ⏳ Time Left: {remaining}
      </Typography>

      {/* VOTE BUTTONS */}
      {!alreadyVoted && remaining !== "Voting Ended" && (
        <Stack direction="row" spacing={2} mb={3}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={() => handleVote("PLAYING")}
          >
            PLAYING
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => handleVote("NOT_PLAYING")}
          >
            NOT PLAYING
          </Button>
        </Stack>
      )}

      {alreadyVoted && (
        <Chip
          label="You have already voted"
          color="info"
          sx={{ mb: 2 }}
        />
      )}

      {/* RESULTS */}
      <Stack spacing={2}>
        <Typography fontWeight="bold">
          Playing: {summary.playing}
        </Typography>

        <Typography fontWeight="bold">
          Not Playing: {summary.notPlaying}
        </Typography>

        <Typography>
          Total Votes: {summary.total}
        </Typography>
      </Stack>
    </Box>
  );
}
