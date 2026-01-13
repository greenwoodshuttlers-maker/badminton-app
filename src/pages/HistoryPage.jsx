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
  TextField
} from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { listenActiveSessions } from "../services/votingService";
import LiveVotingDashboard from "../components/layout/LiveVotingDashboard";

export default function HistoryPage() {
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");


  useEffect(() => {
    const unsub = listenActiveSessions(setSessions);
    return () => unsub && unsub();
  }, []);

  const historySessions = sessions
    .filter(s => s.archived === true)
    .filter(s => {
      if (
        search &&
        !s.title?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      const d = (s.createdAt || s.startTime)?.toDate?.();
      if (!d) return false;

      return (
        d.getFullYear() === year &&
        d.getMonth() === month
      );
    })

    .sort(
      (a, b) =>
        (b.startTime?.seconds || 0) -
        (a.startTime?.seconds || 0)
    );

  return (
    <Box p={2} maxWidth={900} mx="auto">
      <Card sx={{ p: 3, borderRadius: 3 }}>
        {/* ===== TOP BAR ===== */}
        <Stack spacing={2}>
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </Button>

          <Typography variant="h6">
            Voting History
          </Typography>

          {/* ===== FILTERS ===== */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <Select
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.map((m, idx) => (
                <MenuItem key={m} value={idx}>
                  {m}
                </MenuItem>
              ))}

            </Select>

            <Select
              size="small"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {[year, year - 1, year - 2].map(y => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
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

        {historySessions.map(session => (
          <LiveVotingDashboard
            key={session.id}
            session={session}
          />
        ))}
      </Card>
    </Box>
  );
}
