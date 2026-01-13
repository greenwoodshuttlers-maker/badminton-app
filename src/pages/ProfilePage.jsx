import { useEffect, useState } from "react";
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Stack,
    Avatar,
    MenuItem,
    Snackbar
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


/* ================= PROFILE PAGE ================= */
export default function ProfilePage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);

    const [profile, setProfile] = useState({
        nickname: "",
        skillLevel: "",
        experience: "",
        avatarUrl: ""
    });
    const navigate = useNavigate();


    /* ================= LOAD PROFILE ================= */
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.uid) return;

            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();
                setProfile({
                    nickname: data.profile?.nickname || "",
                    skillLevel: data.profile?.skillLevel || "",
                    experience: data.profile?.experience || "",
                    avatarUrl: data.profile?.avatarUrl || ""
                });
            }

            setLoading(false);
        };

        loadProfile();
    }, [user]);

    /* ================= SAVE PROFILE ================= */
    const saveProfile = async () => {
        if (!user?.uid) return;

        setSaving(true);

        await updateDoc(doc(db, "users", user.uid), {
            profile: {
                nickname: profile.nickname.trim(),
                skillLevel: profile.skillLevel,
                experience: profile.experience,
                avatarUrl: profile.avatarUrl.trim()
            }
        });

        setSaving(false);
        setSnackOpen(true);
    };

    /* ================= AVATAR INITIALS ================= */
    const initials =
        profile.nickname?.charAt(0) ||
        user?.name?.charAt(0) ||
        user?.email?.charAt(0) ||
        "?";

    if (loading) {
        return (
            <Box p={2}>
                <Typography>Loading profile…</Typography>
            </Box>
        );
    }

    return (
        <Box p={2} maxWidth={480} mx="auto">
            <Button
                variant="text"
                onClick={() => navigate("/dashboard")}
                sx={{ mb: 1 }}
            >
                ← Back to Dashboard
            </Button>

            {/* ===== HEADER ===== */}
            <Stack spacing={2} alignItems="center" mb={3}>
                <Avatar
                    src={profile.avatarUrl || ""}
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: "#2e7d32",
                        fontSize: 32
                    }}
                >
                    {initials.toUpperCase()}
                </Avatar>

                <Typography variant="h6">My Profile</Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                >
                    This helps other players recognise you
                </Typography>
            </Stack>

            {/* ===== IDENTITY CARD ===== */}
            <Card sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                <Stack spacing={2}>
                    <Typography fontWeight="bold">
                        Identity
                    </Typography>

                    <TextField
                        label="Nickname"
                        placeholder="What should we call you on court?"
                        value={profile.nickname}
                        onChange={(e) =>
                            setProfile({
                                ...profile,
                                nickname: e.target.value
                            })
                        }
                        fullWidth
                    />

                    <TextField
                        label="Avatar Image URL (optional)"
                        placeholder="https://..."
                        value={profile.avatarUrl}
                        onChange={(e) =>
                            setProfile({
                                ...profile,
                                avatarUrl: e.target.value
                            })
                        }
                        fullWidth
                    />
                </Stack>
            </Card>

            {/* ===== PLAYING INFO CARD ===== */}
            <Card sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                <Stack spacing={2}>
                    <Typography fontWeight="bold">
                        Playing Info
                    </Typography>

                    <TextField
                        select
                        label="Skill Level"
                        value={profile.skillLevel}
                        onChange={(e) =>
                            setProfile({
                                ...profile,
                                skillLevel: e.target.value
                            })
                        }
                        fullWidth
                    >
                        <MenuItem value="">Prefer not to say</MenuItem>
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Intermediate">Intermediate</MenuItem>
                        <MenuItem value="Advanced">Advanced</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Playing Experience"
                        value={profile.experience}
                        onChange={(e) =>
                            setProfile({
                                ...profile,
                                experience: e.target.value
                            })
                        }
                        fullWidth
                    >
                        <MenuItem value="">Prefer not to say</MenuItem>
                        <MenuItem value="<1 year">Less than 1 year</MenuItem>
                        <MenuItem value="1-3 years">1–3 years</MenuItem>
                        <MenuItem value="3-5 years">3–5 years</MenuItem>
                        <MenuItem value="5+ years">5+ years</MenuItem>
                    </TextField>
                </Stack>
            </Card>

            {/* ===== SAVE BUTTON ===== */}
            <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                disabled={saving}
                onClick={saveProfile}
                sx={{
                    position: "sticky",
                    bottom: 16,
                    borderRadius: 3
                }}
            >
                {saving ? "Saving…" : "Save Profile"}
            </Button>

            {/* ===== SNACKBAR ===== */}
            <Snackbar
                open={snackOpen}
                autoHideDuration={3000}
                onClose={() => setSnackOpen(false)}
                message="Profile updated"
            />
        </Box>
    );
}
