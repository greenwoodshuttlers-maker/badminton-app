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
  Divider
} from "@mui/material";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp
} from "firebase/firestore";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function BreakfastPanel({ currentUser }) {
  const [players, setPlayers] = useState([]);
  const [rows, setRows] = useState([]);

  // 🆕 Session Info
  const [title, setTitle] = useState("Breakfast");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(dayjs());

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

  /* ================= UPDATE TABLE ROW ================= */
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

  /* ================= TOTAL CALC ================= */
  const totalPaid = rows.reduce(
    (sum, r) => sum + (r.paid ? Number(r.amount) : 0),
    0
  );

  const joinedCount = rows.filter(r => r.joined).length;

  /* ================= SAVE BREAKFAST ================= */
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
      date: date.toDate(),
      joined,
      payers,
      totalAmount: totalPaid,
      createdBy: currentUser.uid,
      createdAt: Timestamp.now()
    });

    alert("✅ Breakfast session saved!");

    // reset UI
    setRows(rows.map(r => ({ ...r, joined: false, paid: false, amount: 0 })));
    setVenue("");
    setTitle("Breakfast");
    setDate(dayjs());
  };

  return (
    <Card sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>

      <Typography fontWeight="bold" fontSize={16}>
        🍳 Create Breakfast Session (Admin)
      </Typography>

      {/* 🆕 Session Inputs */}
      <Box mt={1.5} display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap={1}>
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

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
            slotProps={{
              textField: { size: "small" }
            }}
          />
        </LocalizationProvider>
      </Box>

      {/* ===== TABLE ===== */}
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

      {/* ===== SUMMARY ===== */}
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
  );
}
