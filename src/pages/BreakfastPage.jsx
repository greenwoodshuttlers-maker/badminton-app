import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Divider
} from "@mui/material";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { calculatePlayerStats, getNextPayer } from "../utils/breakfastEngine";

export default function BreakfastPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("editId");

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [players, setPlayers] = useState([]);
  const [rows, setRows] = useState([]);

  const [title, setTitle] = useState("Breakfast");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [expenses, setExpenses] = useState([]);
  const [lastSession, setLastSession] = useState(null);

  /* ================= LOAD PLAYERS ================= */
  useEffect(() => {
    const loadPlayers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));

      setPlayers(list);

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

  /* ================= LOAD BREAKFAST HISTORY ================= */
  useEffect(() => {
    const loadExpenses = async () => {
      const snap = await getDocs(collection(db, "club_expenses"));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.type === "BREAKFAST")
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

      setExpenses(list);
      setLastSession(list[0] || null);
    };

    loadExpenses();
  }, []);

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!editId) return;

    const loadEditSession = async () => {
      const ref = doc(db, "club_expenses", editId);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const data = snap.data();

      setTitle(data.title || "Breakfast");
      setVenue(data.venue || "");
      setDate(dayjs(data.date.toDate()).format("YYYY-MM-DD"));

      setRows(prev =>
        prev.map(r => {
          const joined = data.joined?.includes(r.uid);
          const payer = data.payers?.find(p => p.uid === r.uid);

          return {
            ...r,
            joined: !!joined,
            paid: !!payer,
            amount: payer?.amount || 0
          };
        })
      );
    };

    loadEditSession();
  }, [editId]);

  /* ================= UPDATE ROW ================= */
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

  /* ================= SAVE SESSION ================= */
  const saveBreakfast = async () => {
    const joined = rows.filter(r => r.joined).map(r => r.uid);

    const payers = rows
      .filter(r => r.paid && r.amount > 0)
      .map(r => ({
        uid: r.uid,
        amount: Number(r.amount),
        paidAt: Timestamp.now()
      }));

    const payload = {
      type: "BREAKFAST",
      title,
      venue,
      date: new Date(date),
      joined,
      payers,
      totalAmount: totalPaid,
      createdBy: user.uid,
      createdAt: Timestamp.now()
    };

    if (editId) {
      await updateDoc(doc(db, "club_expenses", editId), payload);
      alert("✅ Breakfast updated!");
    } else {
      await addDoc(collection(db, "club_expenses"), payload);
      alert("✅ Breakfast saved!");
    }

    navigate("/club-expenses/breakfast-history");
  };

  /* ================= NEXT PAYER ENGINE ================= */
  const stats = calculatePlayerStats(expenses);
  const nextPayer = getNextPayer(players, stats);

  const getName = uid => {
    const u = players.find(p => p.uid === uid);
    return u?.profile?.nickname || u?.name || "Unknown";
  };

  /* =====================================================
     👤 PLAYER VIEW (DEFAULT)
  ===================================================== */
  if (!isAdmin) {
    return (
      <Box p={2} maxWidth={900} mx="auto">
        <Card sx={{ p: 2.5, borderRadius: 3 }}>

          {/* 🔙 BACK BUTTON */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/dashboard")}
            sx={{ mb: 1 }}
          >
            ← Back to Dashboard
          </Button>

          <Typography fontWeight="bold" fontSize={18}>
            🍳 Last Breakfast Session
          </Typography>

          {!lastSession && (
            <Typography fontSize={13} color="text.secondary">
              No breakfast records yet.
            </Typography>
          )}

          {lastSession && (
            <Box mt={1.5}>
              <Typography fontWeight="bold">
                📅 {dayjs(lastSession.date.toDate()).format("DD MMM YYYY")}
              </Typography>
              <Typography fontSize={13}>
                📍 Venue: {lastSession.venue || "-"}
              </Typography>
              <Typography fontSize={13}>
                💰 Total Paid: ₹{lastSession.totalAmount}
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography fontSize={13}>
                💳 Paid By:
              </Typography>

              {lastSession.payers?.map(p => (
                <Typography key={p.uid} fontSize={13}>
                  • {getName(p.uid)} ₹{p.amount}
                </Typography>
              ))}
            </Box>
          )}

          {nextPayer && (
            <Card sx={{ p: 1.5, mt: 2, bgcolor: "#f5fff7", borderRadius: 2 }}>
              <Typography fontWeight="bold">
                👑 Next Suggested Payer
              </Typography>
              <Typography fontSize={13}>
                {getName(nextPayer.uid)}
              </Typography>
            </Card>
          )}

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/club-expenses/breakfast-history")}
          >
            📜 View History
          </Button>
        </Card>
      </Box>
    );
  }

  /* =====================================================
     👑 ADMIN VIEW
  ===================================================== */
  return (
    <Box p={2} maxWidth={1000} mx="auto">
      <Card sx={{ p: 2.5, borderRadius: 3 }}>

        {/* 🔙 BACK BUTTON */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/dashboard")}
          sx={{ mb: 1 }}
        >
          ← Back to Dashboard
        </Button>

        <Typography fontWeight="bold" fontSize={18}>
          🍳 Breakfast Admin Panel
        </Typography>

        <Box mt={1.5}>
          <TextField
            label="Title"
            fullWidth
            size="small"
            sx={{ mb: 1 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <TextField
            label="Venue"
            fullWidth
            size="small"
            sx={{ mb: 1 }}
            value={venue}
            onChange={e => setVenue(e.target.value)}
          />

          <TextField
            label="Date"
            type="date"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Table size="small">
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
              <TableRow key={r.uid}>
                <TableCell>
                  <Chip label={r.name} size="small" />
                </TableCell>

                <TableCell align="center">
                  <Checkbox
                    checked={r.joined}
                    onChange={e => updateRow(r.uid, "joined", e.target.checked)}
                  />
                </TableCell>

                <TableCell align="center">
                  <Checkbox
                    checked={r.paid}
                    onChange={e => updateRow(r.uid, "paid", e.target.checked)}
                  />
                </TableCell>

                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={r.amount}
                    disabled={!r.joined}
                    onChange={e => updateRow(r.uid, "amount", e.target.value)}
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
          💾 {editId ? "Update Breakfast" : "Save Breakfast"}
        </Button>

        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
          onClick={() => navigate("/club-expenses/breakfast-history")}
        >
          📜 View History
        </Button>
      </Card>
    </Box>
  );
}
