// src/components/layout/LiveVotingDashboard.jsx

import { useEffect, useRef, useState, useMemo } from "react";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import Tooltip from "@mui/material/Tooltip";
import {
  Box,
  Button,
  Card,
  Typography,
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
  updateSessionAttendance,
  confirmAttendance
} from "../../services/votingService";
import { listenActiveUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import DisplayName from "../DisplayName";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  listenSession
} from "../../services/votingService";



/* =========================================================
   LIVE VOTING DASHBOARD (MOBILE-FIRST SPORTS UI)
   ========================================================= */
export default function LiveVotingDashboard({ session }) {
  const { user } = useAuth();

  /* ================= ROLES ================= */
  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  /* ================= STATE ================= */
  const [votes, setVotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [myAttendanceStatus, setMyAttendanceStatus] = useState(null);
  const [liveSession, setLiveSession] = useState(session);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);



  // Booking
  const [venue, setVenue] = useState(session.booking?.venue || "");
  const [amount, setAmount] = useState(session.booking?.amount || "");

  // Attendance
  const [playedIds, setPlayedIds] = useState(
    session.attendance?.playedUserIds || []
  );

  // Attendance Confirmation
  const myConfirmationStatus =
    session.attendance?.confirmations?.[user.uid];

  const shouldShowConfirmButton =
    session.attendance?.playedUserIds?.includes(user.uid) &&
    myConfirmationStatus === "PENDING";


  {/* ===== PLAYER ATTENDANCE CONFIRMATION POPUP ===== */ }
  <Dialog open={showConfirmPopup} onClose={() => { }}>
    <DialogTitle>🏸 Attendance Confirmation</DialogTitle>
    <DialogContent>
      <Typography fontSize={14}>
        Admin marked you as <b>PLAYING</b> in this game.
        <br />
        Did you actually play?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button
        color="error"
        onClick={async () => {
          await confirmAttendance(session.id, user.uid, "REJECTED");
          setShowConfirmPopup(false);
        }}
      >
        ❌ No, I didn’t play
      </Button>

      <Button
        variant="contained"
        color="success"
        onClick={async () => {
          await confirmAttendance(session.id, user.uid, "CONFIRMED");
          setShowConfirmPopup(false);
        }}
      >
        ✅ Yes, I played
      </Button>
    </DialogActions>
  </Dialog>

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

  const isUserAvailableForSession = (userObj, sessionDate) => {
    const ua = userObj?.profile?.unavailability;
    if (!ua || !ua.from || !ua.to) return true;

    const from = dayjs(ua.from.toDate());
    const to = dayjs(ua.to.toDate());
    const date = dayjs(sessionDate.toDate());

    return !date.isBetween(from, to, "day", "[]");
  };

  /* ================= PER HEAD AMOUNT ================= */
  const perHeadAmount = useMemo(() => {
    if (!amount || playedIds.length === 0) return null;
    return Math.round(Number(amount) / playedIds.length);
  }, [amount, playedIds]);

  /* ================= CONFIRMATION STATUS ================= */
  const confirmations = session.attendance?.confirmations || {};

  const getConfirmationStatus = (uid) => {
    return confirmations[uid] || null; // CONFIRMED | PENDING | REJECTED | null
  };


  /* ================= LISTENERS ================= */

  {/* ===== listenVotesDetailed ===== */ }
  useEffect(() => {
    if (!session?.id) return;
    return listenVotesDetailed(session.id, list =>
      setVotes(Array.isArray(list) ? list : [])
    );
  }, [session.id]);

  {/* ===== listenActiveUsers ===== */ }
  useEffect(() => {
    return listenActiveUsers(list =>
      setUsers(Array.isArray(list) ? list : [])
    );
  }, []);

  {/* ===== attendance ===== */ }
  useEffect(() => {
    if (!liveSession?.attendance?.confirmations || !user?.uid) return;

    const status = liveSession.attendance.confirmations[user.uid];

    if (status === "PENDING") {
      setMyAttendanceStatus(status);
      setShowConfirmPopup(true);
    }
  }, [session.attendance, user.uid]);

  {/* ===== listen Live Session===== */ }
  useEffect(() => {
    if (!session?.id) return;

    return listenSession(session.id, (updatedSession) => {
      setLiveSession(updatedSession);
    });
  }, [session.id]);


  /* ================= TIMER ================= */
  useEffect(() => {
    if (session.status !== "OPEN" || !session.endTime?.toDate) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const diff =
        session.endTime.toDate().getTime() - Date.now();
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
  const mismatchedPlayers = playedIds.filter(uid => {
    const v = votes.find(v => v.userId === uid);
    return v && v.vote !== "PLAYING";
  });

  const availableUsers = useMemo(() => {
    if (!session.eventDate) return users;
    return users.filter(u =>
      isUserAvailableForSession(u, session.eventDate)
    );
  }, [users, session.eventDate]);

  const currentUser = useMemo(() => {
    return users.find(u => u.uid === user.uid);
  }, [users, user.uid]);

  const playing = votes.filter(
    v =>
      v.vote === "PLAYING" &&
      availableUsers.some(u => u.uid === v.userId)
  );

  const notPlaying = votes.filter(
    v =>
      v.vote === "NOT_PLAYING" &&
      availableUsers.some(u => u.uid === v.userId)
  );

  const votedIds = new Set(votes.map(v => v.userId));

  const didntVote = availableUsers.filter(
    u => !votedIds.has(u.uid)
  );

  const myVote = votes.find(v => v.userId === user.uid)?.vote;

  /* ================= ATTENDANCE INTELLIGENCE ================= */

  const votedPlayingIds = playing.map(v => v.userId);
  const votedNotPlayingIds = notPlaying.map(v => v.userId);
  const actuallyPlayedIds = playedIds;

  // ✅ Correct players (voted PLAYING & played)
  const correctPlayers = actuallyPlayedIds.filter(id =>
    votedPlayingIds.includes(id)
  );

  // 🟡 Played but didn’t vote
  const playedButDidntVote = actuallyPlayedIds.filter(id =>
    !votedPlayingIds.includes(id) &&
    !votedNotPlayingIds.includes(id)
  );

  // 🔴 No-show players (voted PLAYING but didn’t play)
  const noShowPlayers = votedPlayingIds.filter(id =>
    !actuallyPlayedIds.includes(id)
  );


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
    await updateSessionAttendance(session.id, playedIds, votes);

    setSnackbar({
      open: true,
      message: "✅ Attendance saved. Players can now confirm.",
      severity: "success"
    });
  };


  /* ================= WHATSAPP SHARE ================= */
  const shareOnWhatsApp = () => {
    const link = `${window.location.origin}/dashboard`;

    const getName = uid => {
      const u = getUser(uid);
      return u?.profile?.nickname || u?.name || "Unknown";
    };

    const playingNames = playing.map(v => getName(v.userId)).join(", ");
    const notPlayingNames = notPlaying.map(v => getName(v.userId)).join(", ");
    const didntVoteNames = didntVote.map(u => u.profile?.nickname || u.name).join(", ");

    const playedIds = session.attendance?.playedUserIds || [];
    const actuallyPlayedNames = playedIds.map(getName).join(", ");

    const didntVoteButPlayed = playedIds.filter(
      id => !votes.some(v => v.userId === id)
    );
    const didntVoteButPlayedNames = didntVoteButPlayed.map(getName).join(", ");

    const noShowPlayers = playing
      .map(v => v.userId)
      .filter(id => !playedIds.includes(id));
    const noShowNames = noShowPlayers.map(getName).join(", ");

    let msg = "";

    // ✅ IMPROVED Phase-1 detection (fresh voting)
    const isFreshVoting =
      session.status === "OPEN" &&
      (votes.length === 0 || playing.length === 0 && notPlaying.length === 0);

    /* ===========================
       🟢 PHASE 1 — Voting Open
    =========================== */
    if (isFreshVoting) {
      msg = `
🏸✨ *Voting Open*

📅 ${formatDate(session.eventDate)}
🗳 ${session.title}

Vote now 👇
${link}
`;
    }

    /* ===========================
       🟡 PHASE 2 — Voting In Progress
    =========================== */
    else if (session.status === "OPEN") {
      msg = `
🏸 *Live Voting Update*

📅 ${formatDate(session.eventDate)}
🗳 ${session.title}

🟢 Playing (${playing.length}): ${playingNames || "-"}
🔴 Not Playing (${notPlaying.length}): ${notPlayingNames || "-"}
⚪ Didn’t Vote (${didntVote.length}): ${didntVoteNames || "-"}

Vote here 👇
${link}
`;
    }

    /* ===========================
       🔴 PHASE 3 — Voting Closed
    =========================== */
    else if (session.status === "CLOSED") {
      msg = `
🏸✨ *FINAL PLAYERS LIST*

📅 ${formatDate(session.eventDate)}
🗳 ${session.title}

🟢 Playing (${playing.length})
${playingNames || "-"}

🎾 Attendance Summary
✅ Played (${playedIds.length}): ${actuallyPlayedNames || "-"}
🟡 Didn’t Vote but Played (${didntVoteButPlayed.length}): ${didntVoteButPlayedNames || "-"}
🔴 No Show (${noShowPlayers.length}): ${noShowNames || "-"}

See details 👇
${link}
`;
    }

    if (!msg.trim()) return;

    window.open(
      "https://wa.me/?text=" + encodeURIComponent(msg.trim()),
      "_blank"
    );
  };


  /* ================= UI ================= */

  return (
    <Card
      sx={{
        p: { xs: 1.2, sm: 2.2 },   // 👈 smaller padding on mobile
        mb: 2,
        borderRadius: 3
      }}
    >


      {/* ===== LIVE HEADER ===== */}
      <Box>
        {session.eventDate && (
          <Typography fontWeight="bold" fontSize={15}>
            📅 {formatDate(session.eventDate)}
          </Typography>
        )}

        <Typography fontWeight={600}>
          🗳 {session.title}
        </Typography>

        <Box mt={0.5} display="flex" gap={1} alignItems="center">
          <Chip
            label={session.status === "OPEN" ? "Voting Live" : "Voting Ended"}
            color={session.status === "OPEN" ? "success" : "error"}
            size="small"
          />
          {timeLeft && session.status === "OPEN" && (
            <Chip label={`⏱ ${timeLeft}`} size="small" />
          )}
        </Box>
      </Box>

      {/* ===== VOTING BUTTONS ===== */}
      {session.status === "OPEN" && (
        <Box mt={2}>
          {currentUser &&
            !isUserAvailableForSession(currentUser, session.eventDate) && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                🚫 You are unavailable due to{" "}
                <strong>
                  {currentUser.profile?.unavailability?.reason || "rest"}
                </strong>
                . Voting disabled.
              </Alert>
            )}

          <Stack direction="row" spacing={1.5}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="success"
              disabled={
                !currentUser ||
                !isUserAvailableForSession(currentUser, session.eventDate)
              }
              onClick={() => castVote(session.id, "PLAYING")}
              startIcon={<SportsTennisIcon />}
              sx={{
                py: { xs: 0.8, sm: 1.4 },
                fontWeight: "bold",
                fontSize: { xs: 12, sm: 14 },
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                textTransform: "none"
              }}
            >
              PLAYING ({playing.length})
            </Button>

            <Button
              fullWidth
              size="large"
              variant="contained"
              color="error"
              disabled={
                !currentUser ||
                !isUserAvailableForSession(currentUser, session.eventDate)
              }
              onClick={() => castVote(session.id, "NOT_PLAYING")}
              sx={{
                py: { xs: 0.8, sm: 1.4 },
                fontWeight: "bold",
                fontSize: { xs: 12, sm: 14 },
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                textTransform: "none"
              }}
            >
              NOT PLAYING ({notPlaying.length})
            </Button>
          </Stack>
        </Box>
      )}

      {myVote && (
        <Typography mt={1} fontSize={13}>
          Your vote:{" "}
          <b style={{ color: myVote === "PLAYING" ? "green" : "red" }}>
            {myVote}
          </b>
        </Typography>
      )}

      {/* ===== BOOKING ===== */}
      <Box sx={{ mt: 2.2, p: 1.6, bgcolor: "#f7fff5", borderRadius: 2 }}>
        <Typography fontWeight="bold">📍 Booking</Typography>

        {isAdmin ? (
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
            <Button size="small" variant="contained" onClick={saveBooking}>
              Save
            </Button>
          </Stack>
        ) : session.booking ? (
          <Box mt={0.5}>
            <Typography fontSize={14}>
              Venue: {session.booking.venue}
            </Typography>
            <Typography fontSize={14}>
              Amount: ₹{session.booking.amount}
            </Typography>
          </Box>
        ) : (
          <Typography fontSize={13} color="text.secondary">
            Not added yet
          </Typography>
        )}
      </Box>

      {/* ===== PAYMENT ===== */}
      <Box sx={{ mt: 2, p: 1.6, bgcolor: "#fffaf2", borderRadius: 2 }}>
        <Typography fontWeight="bold">₹ Payment</Typography>

        {isAdmin ? (
          <Stack>
            {availableUsers.map(u => {
              const isPlayed = playedIds.includes(u.uid);
              const status = getConfirmationStatus(u.uid);

              let statusColor = "#bdbdbd"; // default gray
              let statusLabel = "";

              if (status === "CONFIRMED") {
                statusColor = "#2e7d32"; // green
                statusLabel = "Confirmed";
              } else if (status === "PENDING") {
                statusColor = "#f9a825"; // yellow
                statusLabel = "Pending";
              } else if (status === "REJECTED") {
                statusColor = "#c62828"; // red
                statusLabel = "Rejected";
              }

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
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                      <DisplayName
                        name={u.name}
                        nickname={u.profile?.nickname}
                        role={u.role}
                      />

                      {/* 💰 Per Head Amount */}
                      {isPlayed && perHeadAmount && (
                        <Typography fontSize={12} color="text.secondary">
                          ₹{perHeadAmount}
                        </Typography>
                      )}

                      {/* ✅ Confirmation Status Chip */}
                      {isPlayed && statusLabel && (
                        <Chip
                          label={statusLabel}
                          size="small"
                          sx={{
                            backgroundColor: statusColor,
                            color: "white",
                            borderRadius: "20px",
                            fontSize: "11px",
                            height: "20px"
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              );
            })}
            <Button size="small" variant="contained" onClick={saveAttendance}>
              Save
            </Button>
            {/* ===== ADMIN CONFIRMATION SUMMARY ===== */}
            {playedIds.length > 0 && (
              <Box mt={2} p={1.2} sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }}>

                {/* 🟢 Confirmed */}
                <Typography fontSize={13} fontWeight="bold" color="#2e7d32">
                  🟢 Confirmed Players
                </Typography>
                <Box mb={1}>
                  {playedIds
                    .filter(id => confirmations[id] === "CONFIRMED")
                    .map(id => (
                      <Chip
                        key={id}
                        label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: "#e8f5e9",
                          color: "#2e7d32",
                          borderRadius: "20px"
                        }}
                      />
                    ))}
                </Box>

                {/* 🟡 Pending */}
                <Typography fontSize={13} fontWeight="bold" color="#f9a825">
                  🟡 Pending Players
                </Typography>
                <Box mb={1}>
                  {playedIds
                    .filter(id => confirmations[id] === "PENDING")
                    .map(id => (
                      <Chip
                        key={id}
                        label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: "#fff8e1",
                          color: "#f57f17",
                          borderRadius: "20px"
                        }}
                      />
                    ))}
                </Box>

                {/* 🔴 Rejected */}
                <Typography fontSize={13} fontWeight="bold" color="#c62828">
                  🔴 Rejected Players
                </Typography>
                <Box>
                  {playedIds
                    .filter(id => confirmations[id] === "REJECTED")
                    .map(id => (
                      <Chip
                        key={id}
                        label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: "#ffebee",
                          color: "#c62828",
                          borderRadius: "20px"
                        }}
                      />
                    ))}
                </Box>
              </Box>
            )}
            {/* ================= ATTENDANCE INTELLIGENCE ================= */}
            {isAdmin && session.status !== "OPEN" && (
              <Box mt={2.5} p={2} sx={{ bgcolor: "#f4f6f8", borderRadius: 2 }}>

                <Typography fontWeight="bold" mb={1}>
                  🎯 Attendance Intelligence
                </Typography>

                {/* ✅ Correct Players */}
                <Typography fontSize={13} fontWeight="bold" color="#2e7d32">
                  ✅ Correct Players ({correctPlayers.length})
                </Typography>
                <Box mb={1}>
                  {correctPlayers.map(id => (
                    <Chip
                      key={id}
                      label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        borderRadius: "20px"
                      }}
                    />
                  ))}
                </Box>

                {/* 🟡 Played but didn’t vote */}
                <Typography fontSize={13} fontWeight="bold" color="#f9a825">
                  🟡 Played but Didn’t Vote ({playedButDidntVote.length})
                </Typography>
                <Box mb={1}>
                  {playedButDidntVote.map(id => (
                    <Chip
                      key={id}
                      label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        backgroundColor: "#fff8e1",
                        color: "#f57f17",
                        borderRadius: "20px"
                      }}
                    />
                  ))}
                </Box>

                {/* 🔴 No Show Players */}
                <Typography fontSize={13} fontWeight="bold" color="#c62828">
                  🔴 No Show Players ({noShowPlayers.length})
                </Typography>
                <Box>
                  {noShowPlayers.map(id => (
                    <Chip
                      key={id}
                      label={getUser(id)?.profile?.nickname || getUser(id)?.name}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        borderRadius: "20px"
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        ) : playedIds.length > 0 ? (
          <Typography fontSize={14} mt={0.5}>
            Per Head: ₹{perHeadAmount}
          </Typography>
        ) : (
          <Typography fontSize={13} color="text.secondary">
            Not added yet
          </Typography>
        )}
      </Box>

      {/* ===== PLAYER ATTENDANCE CONFIRM BUTTON ===== */}
      {shouldShowConfirmButton && (
        <Box mt={2}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              background: "linear-gradient(135deg,#ff9800,#f57c00)",
              color: "white",
              fontWeight: "bold",
              borderRadius: 2
            }}
            onClick={() => setOpenConfirmDialog(true)}
          >
            🏸 Confirm My Attendance
          </Button>
        </Box>
      )}


      {/* ===== DETAILS (BOTTOM) ===== */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          👥 View Player Details
        </AccordionSummary>
        <AccordionDetails>
          {[
            ["🟢 Playing", playing],
            ["🔴 Not Playing", notPlaying],
            ["⚪ Didn’t Vote", didntVote]
          ].map(([label, list]) => (
            <Box key={label} mb={1}>
              <Typography fontWeight="bold">
                {label} ({list.length})
              </Typography>
              {list.map(v => {
                const u = v.userId ? getUser(v.userId) : v;
                return (
                  <Typography key={u.uid || v.userId} fontSize={14}>
                    •{" "}
                    <DisplayName
                      name={u.name}
                      nickname={u.profile?.nickname}
                      role={u.role}
                    />
                  </Typography>
                );
              })}
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>


      {/* ===== ADMIN ACTIONS ===== */}
      {isAdmin && session.status === "OPEN" && (
        <Button
          variant="contained"
          color="error"
          sx={{ mt: 2 }}
          onClick={() => endVotingSession(session.id)}
        >
          🛑 End Voting
        </Button>
      )}

      {isAdmin &&
        session.status === "CLOSED" &&
        session.archived !== true && (
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => moveSessionToHistory(session.id)}
          >
            📜 Move to History
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
          ♻️ Reopen Session
        </Button>
      )}


      {/* ===== SHARE ===== */}
      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        onClick={shareOnWhatsApp}
      >
        📤 Share on WhatsApp
      </Button>

      {/* ===== ATTENDANCE CONFIRMATION DIALOG ===== */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>🏸 Attendance Confirmation</DialogTitle>
        <DialogContent>
          <Typography fontSize={14}>
            Admin marked you as <b>PLAYING</b>.
            <br />
            Did you actually play this game?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={async () => {
              await confirmAttendance(session.id, user.uid, "REJECTED");
              setOpenConfirmDialog(false);
            }}
          >
            ❌ No, I didn’t play
          </Button>

          <Button
            variant="contained"
            sx={{ backgroundColor: "#2e7d32" }}
            onClick={async () => {
              await confirmAttendance(session.id, user.uid, "CONFIRMED");
              setOpenConfirmDialog(false);
            }}
          >
            ✅ Yes, I played
          </Button>
        </DialogActions>
      </Dialog>


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
