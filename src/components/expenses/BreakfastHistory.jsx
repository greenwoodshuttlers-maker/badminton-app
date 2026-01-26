import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Chip,
  Divider
} from "@mui/material";
import { db } from "../../services/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import dayjs from "dayjs";

export default function BreakfastHistory() {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const userSnap = await getDocs(collection(db, "users"));
      const userList = userSnap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));
      setUsers(userList);

      const q = query(
        collection(db, "club_expenses"),
        orderBy("date", "desc") // ✅ FIXED
      );

      const snap = await getDocs(q);

      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.type === "BREAKFAST"); // ✅ type exists now

      setExpenses(list);
    };

    load();
  }, []);

  const getName = (uid) => {
    const u = users.find(u => u.uid === uid);
    return u?.profile?.nickname || u?.name || "Unknown";
  };

  return (
    <Box mt={2}>
      <Typography fontWeight="bold" mb={1}>
        📜 Breakfast History
      </Typography>

      {expenses.length === 0 && (
        <Typography fontSize={13} color="text.secondary">
          No breakfast records yet.
        </Typography>
      )}

      {expenses.map(exp => {
        const sessionDate =
          exp.date?.toDate?.() ||
          exp.date ||
          exp.createdAt?.toDate?.();

        return (
          <Card key={exp.id} sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
            <Typography fontWeight="bold">
              🍳 {exp.title || "Breakfast"}
            </Typography>

            <Typography fontSize={13} color="text.secondary">
              📅 {sessionDate
                ? dayjs(sessionDate).format("DD MMM YYYY")
                : "Unknown date"}
            </Typography>

            <Typography fontSize={13}>
              💰 Total Paid: ₹{exp.totalAmount || 0}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {/* 👥 Joined */}
            <Typography fontSize={13}>
              👥 Joined ({exp.joined?.length || 0})
            </Typography>
            <Box mb={0.5}>
              {exp.joined?.map(uid => (
                <Chip
                  key={uid}
                  label={getName(uid)}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>

            {/* 💳 Paid By */}
            <Typography fontSize={13}>
              💳 Paid By
            </Typography>
            {exp.payers?.map(p => (
              <Typography key={p.uid} fontSize={13}>
                • {getName(p.uid)} ₹{p.amount}
              </Typography>
            ))}
          </Card>
        );
      })}
    </Box>
  );
}
