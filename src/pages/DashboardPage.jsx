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
import { buildWhatsAppMessage } from "../utils/whatsappShareBuilder";


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
  if (!dashboardSessions.length) return;

  // 🏸 Session separator
  const SESSION_SEPARATOR =
    "\n\n🏸━━━━━━━━━━━━🏸\n\n";

  // ✅ Load players once
  const usersSnap = await getDocs(
    collection(db, "users")
  );

  const playersMap = {};
  usersSnap.docs.forEach(d => {
    playersMap[d.id] = d.data();
  });

  // ✅ Build messages safely
  const messages = [];

  for (const session of dashboardSessions) {
    const votesSnap = await getDocs(
      collection(
        db,
        "voting_sessions",
        session.id,
        "votes"
      )
    );

    const votes = votesSnap.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    }));

    const enrichedSession = {
      ...session,
      _votes: votes
    };

    const encodedMsg =
      buildWhatsAppMessage(
        enrichedSession,
        playersMap
      );

    if (!encodedMsg) continue;

    messages.push(
      decodeURIComponent(encodedMsg)
    );
  }

  if (!messages.length) return;

  // ✅ Join once
  let finalMessage =
    messages.join(SESSION_SEPARATOR);

  // ✅ ONLY ONE LINK AT END
  finalMessage +=
    `\n\n👉 Vote & details:\n` +
    `${window.location.origin}/dashboard`;

  window.open(
    "https://wa.me/?text=" +
      encodeURIComponent(finalMessage),
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
              <MenuItem onClick={() => navigate("/club-expenses")}>
                💰 Club Expenses
              </MenuItem>
              <MenuItem onClick={() => navigate("/history")}>
                📜 Voting History
              </MenuItem>
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <MenuItem onClick={() => navigate("/users")}>
                  🛠 User Management
                </MenuItem>
              )}
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
