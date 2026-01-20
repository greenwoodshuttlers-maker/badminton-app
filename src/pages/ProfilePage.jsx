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
import { useNavigate, useParams } from "react-router-dom";

import ProfileStatsCard from "../components/ProfileStatsCard";
import ProfileGameList from "../components/ProfileGameList";
import ProfilePaymentSummary from "../components/ProfilePaymentSummary";
import {
  getPlayerStats,
  buildMonthlyPaymentStats
} from "../services/playerStatsService";
import dayjs from "dayjs";


/* ================= PROFILE PAGE ================= */
export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();

  // 🔹 Determine profile mode
  const isOwnProfile =
    !routeUserId || routeUserId === user.uid;

  const effectiveUserId = routeUserId || user.uid;

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const [profile, setProfile] = useState({
    nickname: "",
    skillLevel: "",
    experience: "",
    avatarUrl: "",
    unavailability: {
      reason: "",
      from: "",
      to: ""
    }
  });


  const [statsLoading, setStatsLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState(null);
  const [playedSessions, setPlayedSessions] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      if (!effectiveUserId) return;

      const ref = doc(db, "users", effectiveUserId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          nickname: data.profile?.nickname || "",
          skillLevel: data.profile?.skillLevel || "",
          experience: data.profile?.experience || "",
          avatarUrl: data.profile?.avatarUrl || "",
          unavailability: {
            reason: data.profile?.unavailability?.reason || "",
            from: data.profile?.unavailability?.from
              ? dayjs(data.profile.unavailability.from.toDate()).format("YYYY-MM-DD")
              : "",
            to: data.profile?.unavailability?.to
              ? dayjs(data.profile.unavailability.to.toDate()).format("YYYY-MM-DD")
              : ""
          }
        });

      }

      setLoading(false);
    };

    loadProfile();
  }, [effectiveUserId]);

  /* ================= LOAD STATS ================= */
  useEffect(() => {
    const loadStats = async () => {
      if (!effectiveUserId) return;

      setStatsLoading(true);

      try {
        const { stats, sessions } =
          await getPlayerStats(effectiveUserId);

        setPlayerStats(stats);
        setPlayedSessions(sessions);

        const monthly =
          buildMonthlyPaymentStats(sessions);
        setMonthlyStats(monthly);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [effectiveUserId]);

  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    if (!isOwnProfile) return;

    setSaving(true);

    await updateDoc(doc(db, "users", user.uid), {
      profile: {
        nickname: profile.nickname.trim(),
        skillLevel: profile.skillLevel,
        experience: profile.experience,
        avatarUrl: profile.avatarUrl.trim(),
        unavailability:
          profile.unavailability.reason &&
            profile.unavailability.reason !== "AVAILABLE" &&
            profile.unavailability.from &&
            profile.unavailability.to

            ? {
              reason: profile.unavailability.reason,
              from: new Date(profile.unavailability.from),
              to: new Date(profile.unavailability.to)
            }
            : null
      }
    });

    setSaving(false);
    setSnackOpen(true);
  };

  /* ================= AVATAR INITIAL ================= */
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

        <Typography variant="h6">
          {isOwnProfile ? "My Profile" : "Player Profile"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
        >
          {isOwnProfile
            ? "This helps other players recognise you"
            : "Public profile visible to club members"}
        </Typography>
      </Stack>

      {/* ===== IDENTITY ===== */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: "#e7f4f3ff" }}>
        <Stack spacing={2}>
          <Typography fontWeight="bold">
            Identity
          </Typography>

          <TextField
            label="Nickname"
            value={profile.nickname}
            disabled={!isOwnProfile}
            onChange={(e) =>
              setProfile({
                ...profile,
                nickname: e.target.value
              })
            }
            fullWidth
          />

          <TextField
            label="Avatar Image URL"
            value={profile.avatarUrl}
            disabled={!isOwnProfile}
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

      {/* ===== PLAYING INFO ===== */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: "#f3e4f5ff" }}>
        <Stack spacing={2}>
          <Typography fontWeight="bold">
            Playing Info
          </Typography>

          <TextField
            select
            label="Skill Level"
            value={profile.skillLevel}
            disabled={!isOwnProfile}
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
            disabled={!isOwnProfile}
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

      {/* ===== REST / UNAVAILABILITY ===== */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: "#fff3f3" }}>
        <Stack spacing={2}>
          <Typography fontWeight="bold">
            🛌 Availability / Rest Period
          </Typography>

          <TextField
            select
            label="Status"
            value={profile.unavailability.reason}
            disabled={!isOwnProfile}
            onChange={e =>
              setProfile({
                ...profile,
                unavailability: {
                  ...profile.unavailability,
                  reason: e.target.value
                }
              })
            }
            fullWidth
          >
            <MenuItem value="AVAILABLE">Available</MenuItem>
            <MenuItem value="INJURED">Injured</MenuItem>
            <MenuItem value="VACATION">Vacation</MenuItem>
            <MenuItem value="PERSONAL">Personal Break</MenuItem>

          </TextField>

          {profile.unavailability.reason && (
            <>
              <TextField
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={profile.unavailability.from}
                disabled={!isOwnProfile}
                onChange={e =>
                  setProfile({
                    ...profile,
                    unavailability: {
                      ...profile.unavailability,
                      from: e.target.value
                    }
                  })
                }
              />

              <TextField
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={profile.unavailability.to}
                disabled={!isOwnProfile}
                onChange={e =>
                  setProfile({
                    ...profile,
                    unavailability: {
                      ...profile.unavailability,
                      to: e.target.value
                    }
                  })
                }
              />
            </>
          )}

          {profile.unavailability.reason && (
            <Typography fontSize={13} color="text.secondary">
              You will be excluded from voting during this period.
            </Typography>
          )}
        </Stack>
      </Card>


      {/* ===== STATS ===== */}
      {statsLoading ? (
        <Typography color="text.secondary">
          Loading stats…
        </Typography>
      ) : (
        <ProfileStatsCard stats={playerStats} />
      )}

      {/* ===== ATTENDANCE ===== */}
      <ProfileGameList
        sessions={playedSessions}
        userId={effectiveUserId}
      />

      {/* ===== PAYMENTS ===== */}
      <ProfilePaymentSummary
        monthlyStats={monthlyStats}
      />


      {/* ===== SAVE BUTTON ===== */}
      {isOwnProfile && (
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
            borderRadius: 3,
            mt: 2
          }}
        >
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      )}

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
