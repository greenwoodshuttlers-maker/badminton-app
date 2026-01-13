import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import dayjs from "dayjs";

import {
  castVote,
  endVotingSession,
  moveSessionToHistory,
  reopenArchivedSession,
  listenVotesDetailed
} from "../../services/votingService";
import { listenActiveUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import DisplayName from "../DisplayName";

/* ================= COMPONENT ================= */
export default function LiveVotingDashboard({ session }) {
  const { user } = useAuth();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const [votes, setVotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  // 🔹 NEW: End voting confirmation
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const timerRef = useRef(null);

  /* ================= HELPERS ================= */

  const getUser = uid => users.find(u => u.uid === uid);

  const formatDate = ts =>
    ts ? dayjs(ts.toDate()).format("dddd, DD MMM YYYY") : null;

  /* ================= LISTEN VOTES ================= */
  useEffect(() => {
    if (!session?.id) return;
    return listenVotesDetailed(session.id, list =>
      setVotes(Array.isArray(list) ? list : [])
    );
  }, [session.id]);

  /* ================= LISTEN USERS ================= */
  useEffect(() => {
    return listenActiveUsers(list =>
      setUsers(Array.isArray(list) ? list : [])
    );
  }, []);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (session.status !== "OPEN" || !session.endTime?.toDate) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const diff =
        session.endTime.toDate().getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("0s");
        return;
      }

      const s = Math.floor(diff / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;

      let txt = "";
      if (h > 0) txt += `${h}h `;
      if (m > 0 || h > 0) txt += `${m}m `;
      txt += `${sec}s`;

      setTimeLeft(txt.trim());
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [session.status, session.endTime]);

  /* ================= DERIVED ================= */

  const playing = votes.filter(v => v.vote === "PLAYING");
  const notPlaying = votes.filter(v => v.vote === "NOT_PLAYING");

  // ✅ FIX: Didn’t Vote (used in UI + share)
  const votedIds = new Set(votes.map(v => v.userId));
  const didntVote = users.filter(u => !votedIds.has(u.uid));

  const myVote = votes.find(v => v.userId === user.uid)?.vote;

  /* ================= ACTIONS ================= */

  const handleEndVotingConfirmed = async () => {
    await endVotingSession(session.id);
    setConfirmEndOpen(false);
  };

  /* ================= WHATSAPP SHARE ================= */
  const shareOnWhatsApp = () => {
    const names = arr =>
      arr.map(v => {
        const u = getUser(v.userId);
        return `- ${u?.profile?.nickname || u?.name || v.name}`;
      });

    const didntVoteNames = didntVote.map(
      u => `- ${u.profile?.nickname || u.name}`
    );

    const msg = `
🏸 Badminton Voting

📅 ${formatDate(session.eventDate)}
🗳 ${session.title}

🟢 Playing (${playing.length})
${names(playing).join("\n") || "-"}

🔴 Not Playing (${notPlaying.length})
${names(notPlaying).join("\n") || "-"}

⚪ Didn’t Vote (${didntVote.length})
${didntVoteNames.join("\n") || "-"}

👉 Vote here:
${window.location.origin}/dashboard
`;

    window.open(
      "https://wa.me/?text=" + encodeURIComponent(msg),
      "_blank"
    );
  };

  /* ================= UI ================= */

  return (
    <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      {/* ===== HEADER ===== */}
      {session.eventDate && (
        <Typography variant="subtitle1" fontWeight="bold">
          📅 {formatDate(session.eventDate)}
        </Typography>
      )}

      <Typography variant="body1">{session.title}</Typography>

      <Typography fontSize={13} color="text.secondary">
        Created{" "}
        {dayjs(
          (session.createdAt || session.startTime).toDate()
        ).format("DD MMM YYYY, h:mm A")}
      </Typography>

      <Box mt={1}>
        <Chip
          label={session.status === "OPEN" ? "Voting Live" : "Voting Ended"}
          color={session.status === "OPEN" ? "success" : "error"}
          size="small"
        />
        {timeLeft && session.status === "OPEN" && (
          <Chip
            label={`⏱ ${timeLeft}`}
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Box>

      {/* ===== YOUR STATUS ===== */}
      {myVote && (
        <Typography fontWeight="bold" mt={1}>
          Your vote:{" "}
          <span style={{ color: myVote === "PLAYING" ? "green" : "red" }}>
            {myVote}
          </span>
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ===== ADMIN CONTROLS ===== */}
      {isAdmin && session.status === "OPEN" && (
        <Button
          variant="outlined"
          color="error"
          onClick={() => setConfirmEndOpen(true)}
          sx={{ mb: 2 }}
        >
          End Voting
        </Button>
      )}

      {isAdmin &&
        session.status === "CLOSED" &&
        session.archived !== true && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => moveSessionToHistory(session.id)}
            sx={{ mb: 2 }}
          >
            Move to History
          </Button>
        )}

      {isSuperAdmin && session.archived === true && (
        <Button
          variant="outlined"
          color="success"
          onClick={() =>
            reopenArchivedSession(
              session.id,
              dayjs().add(30, "minute").toDate()
            )
          }
          sx={{ mb: 2 }}
        >
          Reopen Session
        </Button>
      )}

      {/* ===== VOTING ===== */}
      {session.status === "OPEN" && (
        <Stack direction="row" spacing={2} mb={2}>
          <Tooltip title="ARE YOU GAME?" arrow>
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={() => castVote(session.id, "PLAYING")}
            >
              <SportsTennisIcon sx={{ mr: 1 }} />
              PLAYING
            </Button>
          </Tooltip>

          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => castVote(session.id, "NOT_PLAYING")}
          >
            NOT PLAYING
          </Button>
        </Stack>
      )}

      {/* ===== VOTE SUMMARY ===== */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          🟢 Playing ({playing.length})
        </AccordionSummary>
        <AccordionDetails>
          {playing.map(v => {
            const u = getUser(v.userId);
            return (
              <Typography key={v.userId}>
                •{" "}
                <DisplayName
                  name={u?.name || v.name}
                  nickname={u?.profile?.nickname}
                  role={u?.role}
                />
              </Typography>
            );
          })}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          🔴 Not Playing ({notPlaying.length})
        </AccordionSummary>
        <AccordionDetails>
          {notPlaying.map(v => {
            const u = getUser(v.userId);
            return (
              <Typography key={v.userId}>
                •{" "}
                <DisplayName
                  name={u?.name || v.name}
                  nickname={u?.profile?.nickname}
                  role={u?.role}
                />
              </Typography>
            );
          })}
        </AccordionDetails>
      </Accordion>

      {/* ✅ FIXED: Didn’t Vote shown in UI */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          ⚪ Didn’t Vote ({didntVote.length})
        </AccordionSummary>
        <AccordionDetails>
          {didntVote.map(u => (
            <Typography key={u.uid}>
              •{" "}
              <DisplayName
                name={u.name}
                nickname={u.profile?.nickname}
                role={u.role}
              />
            </Typography>
          ))}
        </AccordionDetails>
      </Accordion>

      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        onClick={shareOnWhatsApp}
      >
        📤 Share on WhatsApp
      </Button>

      {/* ===== CONFIRM END VOTING DIALOG ===== */}
      <Dialog
        open={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
      >
        <DialogTitle>⚠️ End Voting?</DialogTitle>
        <DialogContent>
          <Typography>
            This will close voting for:
          </Typography>
          <Typography fontWeight="bold" mt={1}>
            {session.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            Players will not be able to vote anymore.
            <br />
            Super Admin can reopen if required.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEndOpen(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleEndVotingConfirmed}
          >
            End Voting
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
