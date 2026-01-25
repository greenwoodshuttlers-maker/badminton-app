// src/pages/DashboardPage.jsx

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  TextField,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  startVotingSession,
  listenActiveSessions
} from "../services/votingService";

import LiveVotingDashboard from "../components/layout/LiveVotingDashboard";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState("");

  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasNickname, setHasNickname] = useState(false);
  const [eventDate, setEventDate] = useState(null);

  // ✅ Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = e => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  useEffect(() => {
    const unsub = listenActiveSessions(setSessions);
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const loadProfileStatus = async () => {
      if (!user?.uid) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data();
        setHasNickname(!!data.profile?.nickname);
      }

      setProfileLoaded(true);
    };

    loadProfileStatus();
  }, [user]);

  const buildEndTime = () =>
    dayjs()
      .add(days, "day")
      .add(hours, "hour")
      .add(minutes, "minute")
      .toDate();

  const dashboardSessions = sessions.filter(
    s =>
      s.archived !== true &&
      (s.status === "OPEN" || s.status === "CLOSED")
  );

  /* =====================================================
     🔥 SHARE ALL VOTING ON WHATSAPP (PLAYING ONLY)
  ===================================================== */
  const shareAllVotingOnWhatsApp = async () => {
  if (dashboardSessions.length === 0) return;

  const usersSnap = await getDocs(collection(db, "users"));
  const userMap = {};
  usersSnap.docs.forEach(doc => {
    const d = doc.data();
    userMap[doc.id] =
      d.profile?.nickname || d.name || "Unknown";
  });

  const getName = uid => userMap[uid] || "Unknown";

  let message = "🏸 *Badminton Club – Live Voting*\n\n";

  for (const session of dashboardSessions) {
    const votesSnap = await getDocs(
      collection(db, "voting_sessions", session.id, "votes")
    );

    const votes = votesSnap.docs.map(d => d.data());

    const playing = votes.filter(v => v.vote === "PLAYING");
    const notPlaying = votes.filter(v => v.vote === "NOT_PLAYING");

    const votedIds = new Set(votes.map(v => v.userId));

    const allUsers = Object.keys(userMap);
    const didntVote = allUsers.filter(uid => !votedIds.has(uid));

    const playingNames = playing.map(v => getName(v.userId)).join(", ");
    const notPlayingNames = notPlaying.map(v => getName(v.userId)).join(", ");
    const didntVoteNames = didntVote.map(getName).join(", ");

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

    const dateStr = session.eventDate?.toDate
      ? dayjs(session.eventDate.toDate()).format("DD MMM YYYY")
      : "";

    message += `📅 *${session.title}*\n`;
    message += `🗓 ${dateStr}\n\n`;

    // 🟢 PHASE 1 — Voting Open (no votes yet)
    const isFreshVoting =
      session.status === "OPEN" &&
      playing.length === 0 &&
      notPlaying.length === 0;

    if (isFreshVoting) {
      message += `🏸✨ *Voting Open*\n`;
      message += `Vote now 👇\n\n`;
    }

    // 🟡 PHASE 2 — Voting Live
    else if (session.status === "OPEN") {
      message += `🟢 Playing (${playing.length}): ${playingNames || "-"}\n`;
      message += `🔴 Not Playing (${notPlaying.length}): ${notPlayingNames || "-"}\n`;
      message += `⚪ Didn’t Vote (${didntVote.length}): ${didntVoteNames || "-"}\n\n`;
    }

    // 🔴 PHASE 3 — Voting Closed
    else if (session.status === "CLOSED") {
      message += `🏸✨ *FINAL PLAYERS LIST*\n`;
      message += `🟢 Playing (${playing.length}): ${playingNames || "-"}\n\n`;

      if (playedIds.length > 0) {
        message += `🎾 Attendance Summary\n`;
        message += `✅ Played (${playedIds.length}): ${actuallyPlayedNames || "-"}\n`;
        message += `🟡 Didn’t Vote but Played (${didntVoteButPlayed.length}): ${didntVoteButPlayedNames || "-"}\n`;
        message += `🔴 No Show (${noShowPlayers.length}): ${noShowNames || "-"}\n\n`;
      }
    }

    message += "--------------------------------\n\n";
  }

  message += `🔗 Open app:\n${window.location.origin}/dashboard`;

  window.open(
    "https://wa.me/?text=" + encodeURIComponent(message.trim()),
    "_blank"
  );
};


  return (
    <Box p={2} maxWidth={900} mx="auto">

      {/* ================= HEADER ================= */}
      <Card sx={{ p: 2.2, borderRadius: 3, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">

          <Box>
            <Typography fontWeight="bold" fontSize={18}>
              👋 Hi {user.name}
            </Typography>
            <Chip
              label={user.role.replace("_", " ")}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Box>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigate("/profile")}>
                👤 My Profile
              </MenuItem>
              <MenuItem onClick={() => navigate("/players")}>
                👥 Club Members
              </MenuItem>
              <MenuItem onClick={() => navigate("/history")}>
                📜 Voting History
              </MenuItem>
              <Divider />
              <MenuItem onClick={logout} style={{ color: "red" }}>
                🚪 Logout
              </MenuItem>
            </Menu>
          </Box>
        </Stack>
      </Card>

      {/* ================= PROFILE REMINDER ================= */}
      {profileLoaded && !hasNickname && (
        <Card sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography fontWeight="bold">
            ⚠️ Complete your profile
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Add a nickname so other players can recognise you.
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate("/profile")}
          >
            Go to Profile
          </Button>
        </Card>
      )}

      {/* ================= SHARE ALL BUTTON ================= */}
      {dashboardSessions.length > 0 && (
        <Button
          fullWidth
          variant="contained"
          sx={{
            mb: 2,
            background: "linear-gradient(135deg,#25D366,#128C7E)",
            color: "white",
            fontWeight: "bold"
          }}
          onClick={shareAllVotingOnWhatsApp}
        >
          📤 Share All Voting on WhatsApp
        </Button>
      )}

      {/* ================= ADMIN PANEL ================= */}
      {isAdmin && (
        <Card sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" mb={1.5}>
            🛠 Admin Actions
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Select Game Date"
              value={eventDate}
              onChange={newDate => setEventDate(newDate)}
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: { mb: 1.5 }
                }
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Voting Title"
            fullWidth
            size="small"
            sx={{ mb: 1.5 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <Stack direction="row" spacing={1} mb={1.5}>
            <TextField
              label="Days"
              type="number"
              size="small"
              value={days}
              onChange={e =>
                setDays(Math.max(0, +e.target.value))
              }
            />
            <TextField
              label="Hours"
              type="number"
              size="small"
              value={hours}
              onChange={e =>
                setHours(Math.max(0, +e.target.value))
              }
            />
            <TextField
              label="Minutes"
              type="number"
              size="small"
              value={minutes}
              onChange={e =>
                setMinutes(Math.max(0, +e.target.value))
              }
            />
          </Stack>

          <Button
            fullWidth
            variant="contained"
            disabled={!title.trim() || !eventDate}
            onClick={() => {
              startVotingSession(
                buildEndTime(),
                user,
                title.trim(),
                eventDate.toDate()
              );
              setTitle("");
              setEventDate(null);
            }}
          >
            🚀 Start Voting
          </Button>
        </Card>
      )}

      {/* ================= LIVE VOTING ================= */}
      <Typography variant="h6" mb={1.2}>
        🗳 Live Voting
      </Typography>

      {dashboardSessions.length === 0 && (
        <Typography color="text.secondary">
          No active or recent voting sessions.
        </Typography>
      )}

      {dashboardSessions.map(session => (
        <LiveVotingDashboard key={session.id} session={session} />
      ))}
    </Box>
  );
}
