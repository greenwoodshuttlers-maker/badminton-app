import { Typography, Box } from "@mui/material";
import { ROLE_BADGES } from "../config/roleBadges";

export default function DisplayName({
    name,
    nickname,
    role,
    variant = "body1"
}) {
    const display = nickname || name;
    const badge = ROLE_BADGES[role];

    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.8
            }}
        >
            {/* Player Name */}
            <Typography
                component="span"
                variant={variant}
                sx={{
                    fontFamily:
                        '"Inter", "Calibre", "Segoe UI", "Roboto", sans-serif',
                    fontWeight: 500,
                    letterSpacing: "0.2px",
                    color: "text.primary"
                }}
            >
                {display}
            </Typography>

            {/* Role Badge */}
            {badge && (
                <Box
                    component="span"
                    sx={{
                        px: 1,
                        py: "2px",
                        borderRadius: "999px",
                        fontSize: badge.fontSize || "0.7rem",
                        fontWeight: badge.fontWeight || 600,
                        fontStyle: badge.fontStyle || "normal",
                        fontFamily:
                            badge.fontFamily ||
                            '"Inter", "Calibre", "Segoe UI", sans-serif',
                        color: badge.color || "#b8860b",
                        backgroundColor:
                            badge.backgroundColor || "rgba(184, 134, 11, 0.12)",
                        letterSpacing: "0.4px",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",

                        // ✨ Glow animation (only if enabled)
                        ...(badge.glow && {
                            animation: "ceoGlow 2.5s ease-in-out infinite",
                            "@keyframes ceoGlow": {
                                "0%": {
                                    boxShadow: `0 0 0px ${badge.glowColor}`
                                },
                                "50%": {
                                    boxShadow: `0 0 10px ${badge.glowColor}`
                                },
                                "100%": {
                                    boxShadow: `0 0 0px ${badge.glowColor}`
                                }
                            }
                        })
                    }}
                >
                    {badge.label}
                </Box>
            )}
        </Box>
    );
}
