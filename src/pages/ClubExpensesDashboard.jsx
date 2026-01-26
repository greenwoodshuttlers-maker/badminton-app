import { Box, Card, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ClubExpensesDashboard() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <Box p={2} maxWidth={900} mx="auto">
      <Card sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography fontWeight="bold" fontSize={18} mb={1}>
          💰 Club Expenses
        </Typography>

        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ mb: 2 }}
        >
          <Tab label="🍳 Breakfast" />
          <Tab label="🏸 Shuttle Box" />
        </Tabs>

        {tab === 0 && (
          <Card
            sx={{ p: 2, borderRadius: 2, cursor: "pointer" }}
            onClick={() => navigate("/club-expenses/breakfast")}
          >
            <Typography fontWeight="bold">
              🍳 Manage Breakfast Expenses
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              View last session, next payer, history, and admin entry.
            </Typography>
          </Card>
        )}

        {tab === 1 && (
          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Typography fontWeight="bold">
              🏸 Shuttle Box (Coming Soon)
            </Typography>
          </Card>
        )}
      </Card>
    </Box>
  );
}
