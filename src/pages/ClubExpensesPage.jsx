import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Checkbox,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack
} from "@mui/material";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

// 🧠 Next payer engine
import {
  calculatePlayerStats,
  getNextPayer
} from "../utils/breakfastEngine";

/* =========================================================
   🍳 CLUB EXPENSES PAGE (BREAKFAST TRACKING)
========================================================= */
export default function ClubExpensesPage() {
  const { user } = useAuth();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);

  /* ================= FORM STATE (ADMIN) ================= */
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState("Breakfast");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  /* ================= HISTORY ================= */
  const [expenses, setExpenses] = useState([]);

  /* =====================================================
     👥 LOAD PLAYERS
  ===================================================== */
  useEffect(() => {
    const loadPlayers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));

      setPlayers(list);

      // init rows for admin table
      setRows(
        list.map(p => ({
          uid: p.uid,
          name: p.profile?.nickname || p.name,
          joined: false,
          paid: false,
          amount: 0
        }))
      );
    };

    loadPlayers();
  }, []);

  /* =====================================================
     📜 LOAD BREAKFAST HISTORY
  ===================================================== */
  const loadHistory = async () => {
    const q = query(
      collection(db, "club_expenses"),
      orderBy("date", "desc")
    );

    const snap = await getDocs(q);

    const list = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.type === "BREAKFAST");

    setExpenses(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /* =====================================================
     🧩 HELPERS
  ===================================================== */
  const getName = uid => {
    const p = players.find(p => p.uid === uid);
    return p?.profile?.nickname || p?.name || "Unknown";
  };

  const updateRow = (uid, field, value) => {
    setRows(prev =>
      prev.map(r => {
        if (r.uid !== uid) return r;

        let updated = { ...r, [field]: value };

        if (field === "amount") {
          updated.amount = Number(value);
          updated.paid = updated.amount > 0;
        }

        if (field === "paid" && !value) {
          updated.amount = 0;
        }

        return updated;
      })
    );
  };

  const totalPaid = rows.reduce(
    (sum, r) => sum + (r.paid ? Number(r.amount) : 0),
    0
  );

  const joinedCount = rows.filter(r => r.joined).length;

  /* =====================================================
     💾 SAVE BREAKFAST SESSION (ADMIN)
  ===================================================== */
  const saveBreakfast = async () => {
    const joined = rows.filter(r => r.joined).map(r => r.uid);

    const payers = rows
      .filter(r => r.paid && r.amount > 0)
      .map(r => ({
        uid: r.uid,
        amount: Number(r.amount),
        paidAt: Timestamp.now()
      }));

    await addDoc(collection(db, "club_expenses"), {
      type: "BREAKFAST",
      title,
      venue,
      date: Timestamp.fromDate(new Date(date)),
      joined,
      payers,
      totalAmount: totalPaid,
      createdBy: user.uid,
      createdAt: Timestamp.now()
    });

    alert("✅ Breakfast session saved!");

    // reset form
    setRows(rows.map(r => ({ ...r, joined: false, paid: false, amount: 0 })));
    setTitle("Breakfast");
    setVenue("");

    // reload history
    loadHistory();
  };

  /* =====================================================
     👑 NEXT PAYER LOGIC
  ===================================================== */
  const stats = calculatePlayerStats(expenses);
  const nextPayer = getNextPayer(players, stats);

  const getReason = payer => {
    if (!payer) return "";

    if (payer.totalPaid === 0) {
      return "Never paid till date (alphabetical priority applied).";
    }

    return `Last paid ${dayjs(payer.lastPaidAt).fromNow()} and has low contribution.`;
  };

  /* =====================================================
     🥇 LAST BREAKFAST SESSION
  ===================================================== */
  const lastSession = expenses[0];

  return (
    <Box p={2} maxWidth={1000} mx="auto">

      {/* =====================================================
         🍳 HERO PANEL (VISIBLE TO ALL)
      ===================================================== */}
      <Card sx={{ p: 2.5, borderRadius: 3, mb: 2, bgcolor: "#f9fbff" }}>
        <Typography fontWeight="bold" fontSize={16}>
          🍳 Last Breakfast Session
        </Typography>

        {!lastSession && (
          <Typography fontSize={13} color="text.secondary">
            No breakfast sessions yet.
          </Typography>
        )}

        {lastSession && (
          <>
            <Typography fontSize={13} mt={0.5}>
              📅 {dayjs(lastSession.date.toDate()).format("DD MMM YYYY")}
            </Typography>

            {lastSession.venue && (
              <Typography fontSize={13}>
                📍 {lastSession.venue}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />

            <Typography fontSize={13} fontWeight="bold">
              💳 Paid By:
            </Typography>

            {lastSession.payers?.map(p => (
              <Typography key={p.uid} fontSize={13}>
                • {getName(p.uid)} ₹{p.amount}
              </Typography>
            ))}

            <Typography fontSize={13} mt={0.5}>
              💰 Total: ₹{lastSession.totalAmount}
            </Typography>
            <Typography fontSize={13}>
              👥 Joined: {lastSession.joined?.length || 0}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {nextPayer && (
          <>
            <Typography fontWeight="bold" fontSize={15}>
              👑 NEXT PAYEE: {getName(nextPayer.uid)}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Reason: {getReason(nextPayer)}
            </Typography>
          </>
        )}
      </Card>

      {/* =====================================================
         🛠 ADMIN PANEL (ONLY ADMIN)
      ===================================================== */}
      {isAdmin && (
        <Card sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <Typography fontWeight="bold" fontSize={16}>
            🛠 Add Breakfast Session
          </Typography>

          <Stack spacing={1.5} mt={1.5}>
            <TextField
              label="Title"
              size="small"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <TextField
              label="Venue"
              size="small"
              value={venue}
              onChange={e => setVenue(e.target.value)}
            />

            <TextField
              label="Date"
              type="date"
              size="small"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Stack>

          {/* ===== PLAYERS TABLE ===== */}
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="center">Joined?</TableCell>
                <TableCell align="center">Paid?</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map(r => (
                <TableRow
                  key={r.uid}
                  sx={{
                    bgcolor: r.paid
                      ? "#e8f5e9"
                      : r.joined
                      ? "#fff8e1"
                      : "transparent"
                  }}
                >
                  <TableCell>
                    <Chip label={r.name} size="small" />
                  </TableCell>

                  <TableCell align="center">
                    <Checkbox
                      checked={r.joined}
                      onChange={e =>
                        updateRow(r.uid, "joined", e.target.checked)
                      }
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Checkbox
                      checked={r.paid}
                      onChange={e =>
                        updateRow(r.uid, "paid", e.target.checked)
                      }
                    />
                  </TableCell>

                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={r.amount}
                      disabled={!r.joined}
                      onChange={e =>
                        updateRow(r.uid, "amount", e.target.value)
                      }
                      sx={{ width: 90 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 1.5 }} />

          <Box display="flex" justifyContent="space-between">
            <Typography fontSize={14}>
              👥 Joined: <b>{joinedCount}</b>
            </Typography>
            <Typography fontSize={14}>
              💰 Total Paid: <b>₹{totalPaid}</b>
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1.5 }}
            disabled={totalPaid === 0}
            onClick={saveBreakfast}
          >
            💾 Save Breakfast Session
          </Button>
        </Card>
      )}

      {/* =====================================================
         📜 HISTORY SECTION (VISIBLE TO ALL)
      ===================================================== */}
      <Card sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography fontWeight="bold" fontSize={16}>
          📜 Breakfast History
        </Typography>

        {expenses.length === 0 && (
          <Typography fontSize={13} color="text.secondary">
            No breakfast records yet.
          </Typography>
        )}

        {expenses.map(exp => (
          <Card key={exp.id} sx={{ p: 2, mt: 1.5, borderRadius: 2 }}>
            <Typography fontWeight="bold">
              🍳 {exp.title || "Breakfast"}
            </Typography>

            <Typography fontSize={13} color="text.secondary">
              📅 {dayjs(exp.date.toDate()).format("DD MMM YYYY")}
            </Typography>

            {exp.venue && (
              <Typography fontSize={13}>
                📍 {exp.venue}
              </Typography>
            )}

            <Typography fontSize={13}>
              💰 Total Paid: ₹{exp.totalAmount || 0}
            </Typography>

            <Divider sx={{ my: 1 }} />

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

            <Typography fontSize={13}>
              💳 Paid By
            </Typography>

            {exp.payers?.map(p => (
              <Typography key={p.uid} fontSize={13}>
                • {getName(p.uid)} ₹{p.amount}
              </Typography>
            ))}
          </Card>
        ))}
      </Card>
    </Box>
  );
}
