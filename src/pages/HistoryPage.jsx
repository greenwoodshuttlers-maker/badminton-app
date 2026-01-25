// src/pages/HistoryPage.jsx

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Stack,
  Select,
  MenuItem,
  TextField,
  Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// 🔥 Listen sessions
import { listenActiveSessions } from "../services/votingService";

// 🔥 Reuse existing UI
import LiveVotingDashboard from "../components/layout/LiveVotingDashboard";

// 🔥 Firestore
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function HistoryPage() {
  /* =====================================================
     📅 MONTH LIST
  ===================================================== */
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigate = useNavigate();

  /* =====================================================
     📊 STATE
  ===================================================== */
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null); // 👈 hover focus

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");

  /* =====================================================
     👥 LOAD USERS (for name mapping)
  ===================================================== */
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));
      setUsers(list);
    };
    loadUsers();
  }, []);

  const getName = (uid) => {
    const u = users.find(u => u.uid === uid);
    return u?.profile?.nickname || u?.name || "Unknown";
  };

  /* =====================================================
     🎨 CENTRAL COLOR SYSTEM (COLOR PICKER ENABLED)
  ===================================================== */
  const CHIP_COLORS = {
    played: { bg: "#d4edda", text: "#155724" },
    didntVotePlayed: { bg: "#fff3cd", text: "#856404" },
    noShow: { bg: "#f8d7da", text: "#721c24" },
    default: { bg: "#e3f2fd", text: "#0d47a1" }
  };

  /* =====================================================
     🔥 LOAD SESSIONS + VOTES
  ===================================================== */
  useEffect(() => {
    const unsub = listenActiveSessions(async (sessionsList) => {
      const enriched = await Promise.all(
        sessionsList.map(async (s) => {
          const votesSnap = await getDocs(
            collection(db, "voting_sessions", s.id, "votes")
          );

          const votes = votesSnap.docs.map(d => ({
            userId: d.id,
            ...d.data()
          }));

          return {
            ...s,
            _votes: votes
          };
        })
      );

      setSessions(enriched);
    });

    return () => unsub && unsub();
  }, []);

  /* =====================================================
     📊 FILTER HISTORY SESSIONS
  ===================================================== */
  const historySessions = sessions
    .filter(s => s.archived === true)
    .filter(s => {
      if (
        search &&
        !s.title?.toLowerCase().includes(search.toLowerCase())
      ) return false;

      const d = (s.createdAt || s.startTime)?.toDate?.();
      if (!d) return false;

      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort(
      (a, b) =>
        (b.startTime?.seconds || 0) -
        (a.startTime?.seconds || 0)
    );

  /* =====================================================
     🧠 BUILD PLAYER LISTS
  ===================================================== */
  const buildStats = (session) => {
    const votes = session._votes || [];
    const playedIds = session.attendance?.playedUserIds || [];

    const votedPlayingIds = votes
      .filter(v => v.vote === "PLAYING")
      .map(v => v.userId);

    const votedNotPlayingIds = votes
      .filter(v => v.vote === "NOT_PLAYING")
      .map(v => v.userId);

    const actuallyPlayedIds = playedIds;

    const didntVoteButPlayed = actuallyPlayedIds.filter(
      id => !votes.some(v => v.userId === id)
    );

    const noShowPlayers = votedPlayingIds.filter(
      id => !actuallyPlayedIds.includes(id)
    );

    return {
      votedPlayingIds,
      votedNotPlayingIds,
      actuallyPlayedIds,
      didntVoteButPlayed,
      noShowPlayers
    };
  };

  return (
    <Box p={2} maxWidth={1100} mx="auto">
      <Card sx={{ p: 3, borderRadius: 3 }}>
        {/* ===== TOP BAR ===== */}
        <Stack spacing={2}>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>

          <Typography variant="h6">
            📜 Voting History
          </Typography>

          {/* ===== FILTERS ===== */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Select size="small" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m, idx) => (
                <MenuItem key={m} value={idx}>{m}</MenuItem>
              ))}
            </Select>

            <Select size="small" value={year} onChange={(e) => setYear(e.target.value)}>
              {[year, year - 1, year - 2].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>

            <TextField
              size="small"
              fullWidth
              placeholder="Search by voting title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {historySessions.length === 0 && (
          <Typography color="text.secondary">
            No sessions found for selected period.
          </Typography>
        )}

        {/* =====================================================
           🏸 HISTORY SESSIONS (PREMIUM UI)
        ===================================================== */}
        {historySessions.map((session, index) => {
          const stats = buildStats(session);

          const themes = [
            { border: "linear-gradient(135deg,#2196f3,#21cbf3)", bg: "#f5faff" },
            { border: "linear-gradient(135deg,#9c27b0,#e040fb)", bg: "#faf5ff" },
            { border: "linear-gradient(135deg,#2e7d32,#66bb6a)", bg: "#f5fff7" },
            { border: "linear-gradient(135deg,#f57c00,#ffb74d)", bg: "#fff8f0" }
          ];

          const theme = themes[index % themes.length];

          const playedIds = session.attendance?.playedUserIds || [];
          const amount = session.booking?.amount || 0;
          const perHeadAmount =
            playedIds.length > 0
              ? Math.round(amount / playedIds.length)
              : 0;

          const isFocused = activeSessionId === session.id;
          const isDimmed = activeSessionId && activeSessionId !== session.id;

          return (
            <Box
              key={session.id}
              onMouseEnter={() => setActiveSessionId(session.id)}
              onMouseLeave={() => setActiveSessionId(null)}
              sx={{
                mb: 3,
                p: "2px",
                borderRadius: 3,
                background: theme.border,
                transition: "all 0.35s ease",
                filter: isDimmed ? "grayscale(0.9) brightness(0.95)" : "none",
                opacity: isDimmed ? 0.45 : 1,
                transform: isFocused ? "scale(1.015)" : "scale(1)",
                boxShadow: isFocused
                  ? "0 16px 40px rgba(0,0,0,0.18)"
                  : "0 6px 18px rgba(0,0,0,0.08)"
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.bg,
                  borderRadius: 2.5,
                  p: { xs: 1.2, sm: 2.2 },
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#ffffff"
                  }
                }}
              >
                {/* ===== SESSION HEADER ===== */}
                <Box mb={1.5}>
                  <Typography fontWeight="bold" fontSize={17}>
                    🏸 {session.title}
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    📅 {(session.eventDate || session.startTime)?.toDate?.().toDateString()}
                  </Typography>
                </Box>

                {/* ===== LIVE DASHBOARD ===== */}
                <LiveVotingDashboard session={session} />

                {/* ===== SUMMARY CARD ===== */}
                <Card sx={{ p: 1.6, mt: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>

                  {/* 🎾 Actually Played */}
                  <Typography fontSize={14} fontWeight="bold">
                    🎾 Actually Played ({stats.actuallyPlayedIds.length})
                  </Typography>
                  <Box mb={1}>
                    {stats.actuallyPlayedIds.map(id => (
                      <Chip
                        key={id}
                        label={getName(id)}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: CHIP_COLORS.played.bg,
                          color: CHIP_COLORS.played.text,
                          borderRadius: "20px",
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* 🟡 Didn’t Vote but Played */}
                  <Typography fontSize={14} fontWeight="bold">
                    🟡 Didn’t Vote but Played ({stats.didntVoteButPlayed.length})
                  </Typography>
                  <Box mb={1}>
                    {stats.didntVoteButPlayed.map(id => (
                      <Chip
                        key={id}
                        label={getName(id)}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: CHIP_COLORS.didntVotePlayed.bg,
                          color: CHIP_COLORS.didntVotePlayed.text,
                          borderRadius: "20px",
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* 🔴 No Show Players */}
                  <Typography fontSize={14} fontWeight="bold">
                    🔴 No Show Players ({stats.noShowPlayers.length})
                  </Typography>
                  <Box mb={1}>
                    {stats.noShowPlayers.map(id => (
                      <Chip
                        key={id}
                        label={getName(id)}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          backgroundColor: CHIP_COLORS.noShow.bg,
                          color: CHIP_COLORS.noShow.text,
                          borderRadius: "20px",
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* 💰 Payment Info */}
                  <Typography fontSize={14}>
                    💰 Paid Players: <b>{playedIds.length}</b>
                  </Typography>
                  <Typography fontSize={14}>
                    💵 Per Head: ₹<b>{perHeadAmount}</b>
                  </Typography>
                </Card>
              </Box>
            </Box>
          );
        })}
      </Card>
    </Box>
  );
}
