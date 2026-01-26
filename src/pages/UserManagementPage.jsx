import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  useMediaQuery
} from "@mui/material";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

export default function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));
      setUsers(list);
    };

    loadUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Box p={2}>
        <Typography>⛔ Access Denied</Typography>
      </Box>
    );
  }

  const updateUser = async (uid, data) => {
    await updateDoc(doc(db, "users", uid), data);

    setUsers(prev =>
      prev.map(u =>
        u.uid === uid ? { ...u, ...data } : u
      )
    );
  };

  const filteredUsers = users.filter(u =>
    (u.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderRoleSelect = (u) => {
    // 🛡️ SUPER_ADMIN role is locked (no UI change allowed)
    if (u.role === "SUPER_ADMIN") {
      return (
        <Chip
          label="SUPER_ADMIN"
          size="small"
          sx={{
            backgroundColor: "#ede7f6",
            color: "#4a148c",
            fontWeight: "bold"
          }}
        />
      );
    }

    return (
      <Select
        size="small"
        value={u.role}
        fullWidth={isMobile}
        onChange={e =>
          updateUser(u.uid, {
            role: e.target.value
          })
        }
      >
        <MenuItem value="PLAYER">PLAYER</MenuItem>
        <MenuItem value="ADMIN">ADMIN</MenuItem>
      </Select>
    );
  };


  const renderStatusChip = (u) => (
    <Chip
      label={u.status}
      size="small"
      sx={{
        backgroundColor:
          u.status === "ACTIVE"
            ? "#d4edda"
            : "#f8d7da",
        color:
          u.status === "ACTIVE"
            ? "#155724"
            : "#721c24"
      }}
    />
  );

  return (
    <Box p={2} maxWidth={1000} mx="auto">
      <Card sx={{ p: 2.5, borderRadius: 3 }}>

        {/* 🔙 Back */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/dashboard")}
          sx={{ mb: 1 }}
        >
          ← Back to Dashboard
        </Button>

        <Typography fontWeight="bold" fontSize={18}>
          🛠 User Management
        </Typography>

        {/* 🔍 Search */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search player name..."
          sx={{ mt: 1.5, mb: 2 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* ================= DESKTOP TABLE ================= */}
        {!isMobile && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Active?</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.uid}>
                  <TableCell>
                    <Chip
                      label={u.name}
                      size="small"
                      sx={{
                        backgroundColor:
                          u.role === "SUPER_ADMIN"
                            ? "#ede7f6"
                            : u.role === "ADMIN"
                              ? "#e3f2fd"
                              : "#f1f8e9",
                        mr: 0.5
                      }}
                    />
                  </TableCell>

                  <TableCell>{u.email}</TableCell>
                  <TableCell>{renderRoleSelect(u)}</TableCell>
                  <TableCell>{renderStatusChip(u)}</TableCell>

                  <TableCell align="center">
                    <Switch
                      checked={u.status === "ACTIVE"}
                      onChange={e =>
                        updateUser(u.uid, {
                          status: e.target.checked
                            ? "ACTIVE"
                            : "INACTIVE"
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* ================= MOBILE CARDS ================= */}
        {isMobile && (
          <Box>
            {filteredUsers.map(u => (
              <Card
                key={u.uid}
                sx={{
                  p: 1.8,
                  mb: 1.5,
                  borderRadius: 2,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
                }}
              >
                <Typography fontWeight="bold">
                  👤 {u.name}
                </Typography>

                <Typography fontSize={12} color="text.secondary">
                  {u.email}
                </Typography>

                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  {renderStatusChip(u)}
                </Box>

                <Box mt={1}>
                  <Typography fontSize={13}>
                    Role
                  </Typography>
                  {renderRoleSelect(u)}
                </Box>

                <Box
                  mt={1}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontSize={13}>
                    Active
                  </Typography>
                  <Switch
                    checked={u.status === "ACTIVE"}
                    onChange={e =>
                      updateUser(u.uid, {
                        status: e.target.checked
                          ? "ACTIVE"
                          : "INACTIVE"
                      })
                    }
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {filteredUsers.length === 0 && (
          <Typography fontSize={13} color="text.secondary" mt={2}>
            No users found.
          </Typography>
        )}
      </Card>
    </Box>
  );
}
