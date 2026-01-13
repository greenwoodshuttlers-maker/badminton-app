import { Card, Box, Typography, Stack } from "@mui/material";
import dayjs from "dayjs";

/* =========================================================
   PROFILE STATS CARD
   Phase-2.1
   ========================================================= */

export default function ProfileStatsCard({ stats }) {
  if (!stats) return null;

  const {
    gamesPlayed,
    totalSpent,
    avgPerGame,
    firstGameDate,
    lastGameDate
  } = stats;

  const formatDate = (d) =>
    d ? dayjs(d).format("DD MMM YYYY") : "—";

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 3,
        mb: 3,
        bgcolor: "#f5f9ff"
      }}
    >
      <Typography fontWeight="bold" mb={2}>
        📊 My Badminton Stats
      </Typography>

      <Stack spacing={1.2}>
        <StatRow label="🏸 Games Played" value={gamesPlayed} />
        <StatRow label="💰 Total Spent" value={`₹${totalSpent}`} />
        <StatRow label="📊 Avg / Game" value={`₹${avgPerGame}`} />
        <StatRow label="🗓 First Game" value={formatDate(firstGameDate)} />
        <StatRow label="🗓 Last Played" value={formatDate(lastGameDate)} />
      </Stack>
    </Card>
  );
}

/* ================= SMALL HELPER ================= */

function StatRow({ label, value }) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography color="text.secondary" fontSize={14}>
        {label}
      </Typography>
      <Typography fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
