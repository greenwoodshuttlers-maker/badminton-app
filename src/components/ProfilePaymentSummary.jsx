import { Card, Typography, Stack, Box, Divider } from "@mui/material";

/* =========================================================
   PROFILE PAYMENT SUMMARY
   Phase-2.2
   ========================================================= */

export default function ProfilePaymentSummary({ monthlyStats = [] }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#fff7e6",
        mb: 3
      }}
    >
      <Typography fontWeight="bold" mb={2}>
        💰 Payment Summary
      </Typography>

      {monthlyStats.length === 0 ? (
        <Typography color="text.secondary">
          No payment data available
        </Typography>
      ) : (
        <Stack spacing={2}>
          {monthlyStats.map((m, idx) => (
            <Box key={m.monthKey}>
              <Typography fontWeight={600}>
                {m.monthLabel}
              </Typography>

              <Stack
                direction="row"
                justifyContent="space-between"
                mt={0.5}
              >
                <Typography fontSize={14} color="text.secondary">
                  Games
                </Typography>
                <Typography fontWeight={500}>
                  {m.gamesPlayed}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography fontSize={14} color="text.secondary">
                  Total Spent
                </Typography>
                <Typography fontWeight={500}>
                  ₹{m.totalSpent}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography fontSize={14} color="text.secondary">
                  Avg / Game
                </Typography>
                <Typography fontWeight={500}>
                  ₹{m.avgPerGame}
                </Typography>
              </Stack>

              {idx < monthlyStats.length - 1 && (
                <Divider sx={{ mt: 1.5 }} />
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}
