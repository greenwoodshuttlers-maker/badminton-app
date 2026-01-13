import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  CircularProgress
} from "@mui/material";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    if (!isSuperAdmin) return;

    const unsub = onSnapshot(collection(db, "users"), snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setUsers(list);
    });

    return () => unsub();
  }, [isSuperAdmin]);

  /* ================= TOGGLE ROLE ================= */
const toggleRole = async (targetUser) => {
  if (targetUser.id === user.uid) {
    alert("You cannot change your own role.");
    return;
  }

  const newRole =
    targetUser.role === "ADMIN" ? "PLAYER" : "ADMIN";

  try {
    setUpdatingId(targetUser.id);

    // ✅ OPTIMISTIC UI UPDATE (instant)
    setUsers(prev =>
      prev.map(u =>
        u.id === targetUser.id
          ? { ...u, role: newRole }
          : u
      )
    );

    // 🔄 Firestore update (authoritative)
    await updateDoc(
      doc(db, "users", targetUser.id),
      { role: newRole }
    );

  } catch (err) {
    console.error("Role update failed:", err);
    alert("Failed to update role.");

    // 🔙 Rollback if something went wrong
    setUsers(prev =>
      prev.map(u =>
        u.id === targetUser.id
          ? { ...u, role: targetUser.role }
          : u
      )
    );
  } finally {
    setUpdatingId(null);
  }
};


  /* ================= ACCESS DENIED ================= */
  if (!isSuperAdmin) {
    return (
      <Box p={3}>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>

        <Typography color="error" mt={3}>
          Access denied. Only Super Admin can manage users.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* ================= HEADER ================= */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
      </Stack>

      <Typography variant="h5" mb={2}>
        User Management
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Promote or demote users between Player and Admin.
      </Typography>

      {users.map(u => (
        <Card key={u.id} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography fontWeight="bold">
                {u.name || "Unnamed User"}
              </Typography>
              <Typography color="text.secondary">
                {u.email}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography>
                Role: <b>{u.role}</b>
              </Typography>

              {u.role !== "SUPER_ADMIN" && (
                <Button
                  variant="outlined"
                  disabled={updatingId === u.id}
                  onClick={() => toggleRole(u)}
                >
                  {updatingId === u.id ? (
                    <CircularProgress size={18} />
                  ) : (
                    `Make ${u.role === "ADMIN" ? "Player" : "Admin"}`
                  )}
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}
