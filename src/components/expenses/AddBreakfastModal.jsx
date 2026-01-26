import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  Stack,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import { useEffect, useState } from "react";
import { addBreakfastExpense } from "../../services/expenseService";
import { db } from "../../services/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";

export default function AddBreakfastModal({ open, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("Breakfast");
  const [joined, setJoined] = useState([]);
  const [payers, setPayers] = useState({});

  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    };
    loadUsers();
  }, []);

  const toggleJoined = (uid) => {
    setJoined(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const totalAmount = Object.values(payers).reduce(
    (sum, amt) => sum + Number(amt || 0),
    0
  );

  const handleSave = async () => {
    const payerArr = Object.entries(payers)
      .filter(([_, amt]) => amt > 0)
      .map(([uid, amount]) => ({
        uid,
        amount: Number(amount),
        paidAt: Timestamp.now()
      }));

    await addBreakfastExpense({
      title,
      date: new Date(),
      joined,
      payers: payerArr,
      totalAmount,
      createdBy: currentUser.uid
    });

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        bgcolor: "white",
        p: 3,
        borderRadius: 2,
        width: "90%",
        maxWidth: 450,
        mx: "auto",
        mt: "10%"
      }}>
        <Typography fontWeight="bold" mb={1}>
          🍳 Add Breakfast Record
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography fontSize={14} fontWeight="bold">
          👥 Who Joined?
        </Typography>

        <Stack>
          {users.map(u => (
            <FormControlLabel
              key={u.uid}
              control={
                <Checkbox
                  checked={joined.includes(u.uid)}
                  onChange={() => toggleJoined(u.uid)}
                />
              }
              label={u.profile?.nickname || u.name}
            />
          ))}
        </Stack>

        <Typography fontSize={14} fontWeight="bold" mt={1}>
          💳 Who Paid?
        </Typography>

        {joined.map(uid => {
          const user = users.find(u => u.uid === uid);
          return (
            <TextField
              key={uid}
              size="small"
              fullWidth
              type="number"
              label={`${user?.profile?.nickname || user?.name} paid`}
              onChange={e =>
                setPayers(prev => ({
                  ...prev,
                  [uid]: e.target.value
                }))
              }
              sx={{ mb: 1 }}
            />
          );
        })}

        <Typography fontWeight="bold" mt={1}>
          💰 Total: ₹{totalAmount}
        </Typography>

        <Button fullWidth variant="contained" onClick={handleSave}>
          Save Breakfast
        </Button>
      </Box>
    </Modal>
  );
}
