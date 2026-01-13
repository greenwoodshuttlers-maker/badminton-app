import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  TextField,
  Chip,
  Divider
} from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  startVotingSession,
  listenActiveSessions
} from "../services/votingService";

import LiveVotingDashboard from "../components/layout/LiveVotingDashboard";
import { doc, getDoc } from "firebase/firestore";
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

  return (
    <Box p={2} maxWidth={900} mx="auto">
      {/* ================= HEADER ================= */}
      <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              👋 Hi {user.name}
            </Typography>
            <Chip
              label={user.role.replace("_", " ")}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Profile completion reminder */}
          {profileLoaded && !hasNickname && (
            <Card
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Typography fontWeight="bold">
                Complete your profile
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                mb={1}
              >
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

          {/* Quick actions */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/profile")}
            >
              My Profile
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/players")}
            >
              Club Members
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/history")}
            >
              Voting History
            </Button>
          </Stack>

          <Divider />

          <Button
            variant="outlined"
            color="error"
            onClick={logout}
          >
            Logout
          </Button>
        </Stack>
      </Card>

      {/* ================= ADMIN ACTIONS ================= */}
      {isAdmin && (
        <Card sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Typography variant="h6" mb={2}>
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
                  sx: { mb: 2 }
                }
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Voting Title"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            mb={2}
          >
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

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <Button
              fullWidth
              variant="contained"
              disabled={!title.trim()}
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
              Start Voting
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/users")}
            >
              User Management
            </Button>
          </Stack>
        </Card>
      )}

      {/* ================= LIVE VOTING ================= */}
      <Typography variant="h6" mb={2}>
        🗳 Live Voting
      </Typography>

      {dashboardSessions.length === 0 && (
        <Typography color="text.secondary">
          No active or recent voting sessions.
        </Typography>
      )}

      {dashboardSessions.map(session => (
        <LiveVotingDashboard
          key={session.id}
          session={session}
        />
      ))}
    </Box>
  );
}
