import { Card, Typography, Stack, Box, Divider } from "@mui/material";
import dayjs from "dayjs";

/* =========================================================
   PROFILE GAME LIST
   Phase-2.1
   ========================================================= */

export default function ProfileGameList({ sessions = [], userId }) {
  if (!sessions.length || !userId) {
    return (
      <Card sx={{ p: 2, borderRadius: 3 }}>
        <Typography fontWeight="bold" mb={1}>
          🗂 My Games
        </Typography>
        <Typography color="text.secondary">
          No games played yet
        </Typography>
      </Card>
    );
  }

  // Sort latest → oldest
  const sortedSessions = [...sessions].sort((a, b) => {
    const da = a.eventDate?.toDate?.() || 0;
    const db = b.eventDate?.toDate?.() || 0;
    return db - da;
  });

  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <Typography fontWeight="bold" mb={2}>
        🗂 My Games
      </Typography>

      <Stack spacing={2}>
        {sortedSessions.map((session, idx) => {
          const playedCount =
            session.attendance?.playedUserIds?.length || 1;
          const totalAmount = session.booking?.amount || 0;
          const perHead = Math.round(totalAmount / playedCount);

          return (
            <Box key={session.id}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={500}>
                    {session.title}
                  </Typography>
                  <Typography
                    fontSize={13}
                    color="text.secondary"
                  >
                    {session.eventDate?.toDate
                      ? dayjs(
                          session.eventDate.toDate()
                        ).format("dddd, DD MMM YYYY")
                      : "—"}
                  </Typography>
                </Box>

                <Typography fontWeight={600}>
                  ₹{perHead}
                </Typography>
              </Box>

              {idx < sortedSessions.length - 1 && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
