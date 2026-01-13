import { useEffect, useRef, useState, useMemo } from "react";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import Tooltip from "@mui/material/Tooltip";
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
  TextField,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dayjs from "dayjs";

import {
  castVote,
  endVotingSession,
  moveSessionToHistory,
  reopenArchivedSession,
  listenVotesDetailed,
  updateSessionBooking,
  updateSessionAttendance
} from "../../services/votingService";

import { listenActiveUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import DisplayName from "../DisplayName";

export default function LiveVotingDashboard({ session }) {
  const { user } = useAuth();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const [votes, setVotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  // Booking state
  const [venue, setVenue] = useState(session.booking?.venue || "");
  const [amount, setAmount] = useState(session.booking?.amount || "");

  // Attendance state
  const [playedIds, setPlayedIds] = useState(
    session.attendance?.playedUserIds || []
  );

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const timerRef = useRef(null);

  /* ================= HELPERS ================= */

  const getUser = uid => users.find(u => u.uid === uid);

  const formatDate = ts =>
    ts ? dayjs(ts.toDate()).format("dddd, DD MMM YYYY") : null;

  const perHeadAmount = useMemo(() => {
    if (!session.booking?.amount || playedIds.length === 0) return null;
    return Math.round(session.booking.amount / playedIds.length);
  }, [session.booking?.amount, playedIds]);

  /* ================= LISTENERS ================= */

  useEffect(() => {
    if (!session?.id) return;
    return listenVotesDetailed(session.id, setVotes);
  }, [session.id]);

  useEffect(() => {
    return listenActiveUsers(setUsers);
  }, []);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (session.status !== "OPEN" || !session.endTime?.toDate) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const diff = session.endTime.toDate().getTime() - Date.now();
      if (diff <= 0) return setTimeLeft("0s");

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

  const votedIds = new Set(votes.map(v => v.userId));
  const didntVote = users.filter(u => !votedIds.has(u.uid));

  const myVote = votes.find(v => v.userId === user.uid)?.vote;

  /* ================= ACTIONS ================= */

  const saveBooking = async () => {
    await updateSessionBooking(session.id, {
      venue,
      amount: Number(amount),
      currency: "INR"
    });

    setSnackbar({
      open: true,
      message: "✅ Booking details saved successfully",
      severity: "success"
    });
  };

  const togglePlayed = uid => {
    setPlayedIds(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const saveAttendance = async () => {
    await updateSessionAttendance(session.id, playedIds);

    setSnackbar({
      open: true,
      message: "✅ Attendance & split amount updated",
      severity: "success"
    });
  };

  /* ================= UI ================= */

  return (
    <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>

      {/* ===== HEADER ===== */}
      {session.eventDate && (
        <Typography fontWeight="bold">
          📅 {formatDate(session.eventDate)}
        </Typography>
      )}

      <Typography>{session.title}</Typography>

      <Typography fontSize={13} color="text.secondary">
        Voting created on{" "}
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
          <Chip label={`⏱ ${timeLeft}`} size="small" sx={{ ml: 1 }} />
        )}
      </Box>

      {/* ===== VOTING SECTION ===== */}
      <Box sx={{ bgcolor: "#f5f9ff", p: 2, borderRadius: 2, mt: 2 }}>
        {myVote && (
          <Typography fontWeight="bold" mb={1}>
            Your vote:{" "}
            <span style={{ color: myVote === "PLAYING" ? "green" : "red" }}>
              {myVote}
            </span>
          </Typography>
        )}

        {isAdmin && session.status === "OPEN" && !session.archived && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => endVotingSession(session.id)}
            sx={{ mb: 2 }}
          >
            End Voting
          </Button>
        )}

        {session.status === "OPEN" && (
          <Stack direction="row" spacing={2} mb={2}>
            <Tooltip title="ARE YOU GAME?" arrow>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={() => castVote(session.id, "PLAYING")}
              >
                <SportsTennisIcon /> PLAYING
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
                  {v.votedAt && (
                    <span style={{ fontSize: 12, color: "#777", marginLeft: 6 }}>
                      ({dayjs(v.votedAt.toDate()).format("DD MMM, h:mm A")})
                    </span>
                  )}
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
                  {v.votedAt && (
                    <span style={{ fontSize: 12, color: "#777", marginLeft: 6 }}>
                      ({dayjs(v.votedAt.toDate()).format("DD MMM, h:mm A")})
                    </span>
                  )}
                </Typography>
              );
            })}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* ===== BOOKING SECTION ===== */}
      <Box sx={{ bgcolor: "#f7fff5", p: 2, borderRadius: 2, mt: 3 }}>
        <Typography fontWeight="bold">📍 Booking Details</Typography>

        {isAdmin && !session.archived ? (
          <Stack spacing={1} mt={1}>
            <TextField
              label="Venue"
              size="small"
              value={venue}
              onChange={e => setVenue(e.target.value)}
            />
            <TextField
              label="Amount Paid (₹)"
              size="small"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <Button variant="contained" onClick={saveBooking}>
              Save Booking
            </Button>
          </Stack>
        ) : session.booking ? (
          <Box mt={1}>
            <Typography>Venue: {session.booking.venue}</Typography>
            <Typography>Amount Paid: ₹{session.booking.amount}</Typography>
          </Box>
        ) : (
          <Typography color="text.secondary">
            Booking details not added yet by Admin
          </Typography>
        )}
      </Box>

      {/* ===== ATTENDANCE SECTION ===== */}
      <Box sx={{ bgcolor: "#fffaf2", p: 2, borderRadius: 2, mt: 3 }}>
        <Typography fontWeight="bold">₹ Payment Details</Typography>

        {isAdmin && !session.archived ? (
          <Stack>
            {users.map(u => {
              const isPlayed = playedIds.includes(u.uid);
              return (
                <FormControlLabel
                  key={u.uid}
                  control={
                    <Checkbox
                      checked={isPlayed}
                      onChange={() => togglePlayed(u.uid)}
                    />
                  }
                  label={
                    <Box display="flex" gap={1} alignItems="center">
                      <DisplayName
                        name={u.name}
                        nickname={u.profile?.nickname}
                        role={u.role}
                      />
                      {isPlayed && perHeadAmount && (
                        <Typography fontSize={13} color="text.secondary">
                          ₹{perHeadAmount}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              );
            })}
            <Button variant="contained" onClick={saveAttendance}>
              Save Attendance
            </Button>
          </Stack>
        ) : playedIds.length > 0 ? (
          <Stack mt={1}>
            {playedIds.map(uid => {
              const u = getUser(uid);
              return (
                <Typography key={uid}>
                  •{" "}
                  <DisplayName
                    name={u?.name}
                    nickname={u?.profile?.nickname}
                    role={u?.role}
                  />{" "}
                  – ₹{perHeadAmount}
                </Typography>
              );
            })}
          </Stack>
        ) : (
          <Typography color="text.secondary">
            Payment details not added yet by Admin
          </Typography>
        )}
      </Box>

      {/* ===== HISTORY ACTIONS ===== */}
      {isAdmin &&
        session.status === "CLOSED" &&
        session.archived !== true && (
          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            onClick={() => moveSessionToHistory(session.id)}
          >
            Move to History
          </Button>
        )}

      {isSuperAdmin && session.archived === true && (
        <Button
          variant="outlined"
          color="success"
          sx={{ mt: 2 }}
          onClick={() =>
            reopenArchivedSession(
              session.id,
              dayjs().add(30, "minute").toDate()
            )
          }
        >
          Reopen Session
        </Button>
      )}

      {/* ===== SNACKBAR ===== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
