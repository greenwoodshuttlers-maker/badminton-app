import { Box, Card, Typography, Chip, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import { getBreakfastExpenses } from "../../services/expenseService";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import { calculatePlayerStats, getNextPayer } from "../../utils/breakfastEngine";

export default function BreakfastList() {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const list = await getBreakfastExpenses();
      setExpenses(list);

      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    };
    load();
  }, []);

  const getName = (uid) => {
    const u = users.find(u => u.uid === uid);
    return u?.profile?.nickname || u?.name || "Unknown";
  };

  // ✅ Calculate stats across ALL breakfasts
  const stats = calculatePlayerStats(expenses);
  const nextPayer = getNextPayer(users, stats);

  return (
    <Box mt={2}>

      {/* ================= NEXT PAYER BOARD ================= */}
      {nextPayer && (
        <Card sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f5fff7" }}>
          <Typography fontWeight="bold">
            👑 Next Suggested Payer
          </Typography>
          <Typography fontSize={14}>
            {getName(nextPayer.uid)} • ₹{nextPayer.totalPaid} paid • 
            {nextPayer.lastPaidAt
              ? ` last paid ${dayjs(nextPayer.lastPaidAt).fromNow()}`
              : " never paid"}
          </Typography>
        </Card>
      )}

      {/* ================= BREAKFAST HISTORY ================= */}
      {expenses.map(exp => {
        const total = exp.totalAmount || 0;

        return (
          <Card key={exp.id} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography fontWeight="bold">
              🍳 {exp.title}
            </Typography>

            <Typography fontSize={13} color="text.secondary">
              📅 {dayjs(exp.date.toDate()).format("DD MMM YYYY")}
            </Typography>

            <Typography fontSize={13}>
              💰 Total Expense: ₹{total}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {/* 👥 Joined */}
            <Typography fontSize={14}>
              👥 Joined ({exp.joined?.length || 0})
            </Typography>
            <Box mt={0.5}>
              {exp.joined?.map(uid => (
                <Chip
                  key={uid}
                  label={getName(uid)}
                  size="small"
                  sx={{
                    mr: 0.5,
                    mb: 0.5,
                    backgroundColor: "#e3f2fd",
                    color: "#0d47a1",
                    borderRadius: "20px"
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* 💳 Paid By */}
            <Typography fontSize={14}>
              💳 Paid By
            </Typography>

            {exp.payers?.map(p => (
              <Typography key={p.uid} fontSize={13}>
                • {getName(p.uid)} ₹{p.amount} 
                {" "}({dayjs(p.paidAt.toDate()).format("DD MMM")})
              </Typography>
            ))}
          </Card>
        );
      })}
    </Box>
  );
}
