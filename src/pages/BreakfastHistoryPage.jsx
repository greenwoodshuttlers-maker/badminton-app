import { useEffect, useState } from "react";
import {
    Box,
    Card,
    Typography,
    Button,
    Chip,
    Divider
} from "@mui/material";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

export default function BreakfastHistoryPage() {
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin =
        user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    useEffect(() => {
        const load = async () => {
            // 👥 Load users for name mapping
            const userSnap = await getDocs(collection(db, "users"));
            const userList = userSnap.docs.map(d => ({
                uid: d.id,
                ...d.data()
            }));
            setUsers(userList);

            // 🍳 Load breakfast expenses
            const snap = await getDocs(collection(db, "club_expenses"));
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(e => e.type === "BREAKFAST")
                .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            setExpenses(list);
        };

        load();
    }, []);

    const getName = uid => {
        const u = users.find(u => u.uid === uid);
        return u?.profile?.nickname || u?.name || "Unknown";
    };

    return (
        <Box p={2} maxWidth={900} mx="auto">
            <Card sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography fontWeight="bold" fontSize={18}>
                    📜 Breakfast History
                </Typography>

                <Button
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={() => navigate("/club-expenses/breakfast")}
                >
                    ← Back
                </Button>

                {expenses.length === 0 && (
                    <Typography fontSize={13} color="text.secondary" mt={1}>
                        No breakfast records yet.
                    </Typography>
                )}

                {expenses.map(exp => (
                    <Card key={exp.id} sx={{ p: 2, mt: 2, borderRadius: 2 }}>
                        <Typography fontWeight="bold">
                            🍳 {exp.title}
                        </Typography>

                        <Typography fontSize={13} color="text.secondary">
                            📅 {dayjs(exp.date.toDate()).format("DD MMM YYYY")}
                        </Typography>

                        <Typography fontSize={13}>
                            📍 Venue: {exp.venue || "-"}
                        </Typography>

                        <Typography fontSize={13}>
                            💰 Total Paid: ₹{exp.totalAmount}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        {/* 👥 Joined Players */}
                        <Typography fontSize={13} fontWeight="bold">
                            👥 Joined Players ({exp.joined?.length || 0})
                        </Typography>
                        <Box mt={0.5} mb={1}>
                            {exp.joined?.map(uid => (
                                <Chip
                                    key={uid}
                                    label={getName(uid)}
                                    size="small"
                                    color="default"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            ))}
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* 💳 Paid By */}
                        <Typography fontSize={13} fontWeight="bold">
                            💳 Paid By
                        </Typography>

                        <Box mt={0.5} mb={1}>
                            {exp.payers?.map(p => (
                                <Chip
                                    key={p.uid}
                                    label={`${getName(p.uid)} ₹${p.amount}`}
                                    size="small"
                                    sx={{
                                        mr: 0.5,
                                        mb: 0.5,
                                        backgroundColor: "#e8f5e9",   // 🎨 color picker works here
                                        color: "#1b5e20",
                                        borderRadius: "20px",
                                        fontWeight: 500
                                    }}
                                />
                            ))}
                        </Box>


                        {/* ✏️ Admin Edit */}
                        {isAdmin && (
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                                onClick={() =>
                                    navigate(`/club-expenses/breakfast?editId=${exp.id}`)
                                }
                            >
                                ✏️ Edit
                            </Button>
                        )}
                    </Card>
                ))}
            </Card>
        </Box>
    );
}
