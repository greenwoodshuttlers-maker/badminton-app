import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Card,
    Typography,
    Stack,
    CircularProgress,
    TextField,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    Avatar,
    InputAdornment,
    Button
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CircleIcon from "@mui/icons-material/Circle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DisplayName from "../components/DisplayName";


dayjs.extend(utc);
dayjs.extend(timezone);

/* ================= IST RULE ================= */
const formatIST = ts => {
    if (!ts) return "Unknown";
    return dayjs(ts.toDate())
        .tz("Asia/Kolkata")
        .format("DD MMM YYYY, hh:mm A");
};

export default function Players() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const loadPlayers = async () => {
            const snap = await getDocs(collection(db, "users"));

            const data = snap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name,
                    nickname: d.profile?.nickname,
                    role: d.role || "PLAYER",
                    isOnline: d.isOnline === true,
                    lastLoginAt: d.lastLoginAt || null
                };
            });

            setPlayers(data);
            setLoading(false);
        };

        loadPlayers();
    }, []);

    /* ================= SORT + SEARCH ================= */
    const filteredPlayers = useMemo(() => {
        const q = search.toLowerCase();

        return players
            .filter(p =>
                (p.nickname || p.name)
                    ?.toLowerCase()
                    .includes(q)
            )
            .sort((a, b) =>
                (a.nickname || a.name)
                    .localeCompare(b.nickname || b.name)
            );
    }, [players, search]);

    const roleColor = role => {
        if (role === "SUPER_ADMIN") return "warning";
        if (role === "ADMIN") return "info";
        if (role === "PLAYER") return "success";
        return "default";
    };

    if (loading) {
        return (
            <Box textAlign="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={2} maxWidth={900} mx="auto">
            {/* ================= TOP BAR ================= */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </Button>

                <Chip
                    label={`Total Members: ${players.length}`}
                    color="primary"
                />
            </Stack>

            <Typography variant="h5" fontWeight="bold" mb={2}>
                👥 Club Members
            </Typography>

            {/* ================= SEARCH ================= */}
            <TextField
                fullWidth
                placeholder="Search members"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
            />

            {filteredPlayers.length === 0 && (
                <Typography color="text.secondary">
                    No matching members found.
                </Typography>
            )}

            {/* ================= MEMBERS LIST ================= */}
            <Stack spacing={2}>
                {filteredPlayers.map(player => {
                    const isSuperAdmin =
                        player.role === "SUPER_ADMIN";
                    const isSelf = player.id === user.uid;

                    return (
                        <Card
                            key={player.id}
                            onClick={() => setSelected(player)}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                bgcolor: isSelf
                                    ? "rgba(25,118,210,0.08)"
                                    : "background.paper",
                                border: isSuperAdmin
                                    ? "2px solid gold"
                                    : isSelf
                                        ? "1px solid #1976d2"
                                        : "1px solid transparent",
                                animation: isSuperAdmin
                                    ? "pulse 2s infinite"
                                    : "none",
                                "@keyframes pulse": {
                                    "0%": {
                                        boxShadow:
                                            "0 0 0 0 rgba(255,215,0,0.6)"
                                    },
                                    "70%": {
                                        boxShadow:
                                            "0 0 0 12px rgba(255,215,0,0)"
                                    },
                                    "100%": {
                                        boxShadow:
                                            "0 0 0 0 rgba(255,215,0,0)"
                                    }
                                }
                            }}
                        >
                            {/* Left */}
                            <Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <Typography variant="h6">
                                        <DisplayName
                                            name={player.name}
                                            nickname={player.nickname}
                                            role={player.role}
                                        />
                                    </Typography>


                                    {player.isOnline && (
                                        <CircleIcon
                                            sx={{
                                                fontSize: 10,
                                                color: "green"
                                            }}
                                        />
                                    )}

                                    {isSelf && (
                                        <Chip
                                            label="You"
                                            size="small"
                                            color="primary"
                                        />
                                    )}

                                    {isSelf &&
                                        player.role === "SUPER_ADMIN" && (
                                            <EmojiEventsIcon
                                                fontSize="small"
                                                sx={{ color: "gold" }}
                                            />
                                        )}
                                </Stack>

                                {player.nickname && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {player.name}
                                    </Typography>
                                )}

                                {!player.isOnline && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Last active:{" "}
                                        {formatIST(player.lastLoginAt)}
                                    </Typography>
                                )}
                            </Box>

                            {/* Right */}
                            <Chip
                                label={player.role.replace("_", " ")}
                                color={roleColor(player.role)}
                            />
                        </Card>
                    );
                })}
            </Stack>

            {/* ================= PROFILE MODAL ================= */}
            <Dialog
                open={!!selected}
                onClose={() => setSelected(null)}
                maxWidth="xs"
                fullWidth
            >
                {selected && (
                    <>
                        <DialogTitle>
                            Player Profile
                        </DialogTitle>
                        <DialogContent>
                            <Stack
                                spacing={2}
                                alignItems="center"
                                mt={1}
                            >
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor:
                                            selected.role === "SUPER_ADMIN"
                                                ? "gold"
                                                : "primary.main",
                                        color: "black",
                                        fontSize: 32
                                    }}
                                >
                                    {(selected.nickname || selected.name)
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </Avatar>

                                <Typography variant="h6">
                                    {selected.nickname ||
                                        selected.name}
                                </Typography>

                                {selected.nickname && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {selected.name}
                                    </Typography>
                                )}

                                <Chip
                                    label={selected.role.replace("_", " ")}
                                    color={roleColor(selected.role)}
                                />
                            </Stack>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
