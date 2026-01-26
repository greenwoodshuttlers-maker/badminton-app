import { useEffect, useState } from "react";
import { Box, Card, Typography, Divider, Button } from "@mui/material";
import { db } from "../../services/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import dayjs from "dayjs";
import { calculatePlayerStats, getNextPayer } from "../../utils/breakfastEngine";

export default function BreakfastHero({ players }) {
  const [lastSession, setLastSession] = useState(null);
  const [stats, setStats] = useState({});
  const [nextPayer, setNextPayer] = useState(null);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "club_expenses"),
        orderBy("date", "desc"),
        limit(1)
      );

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.type === "BREAKFAST");

      if (docs.length > 0) {
        setLastSession(docs[0]);
      }

      // load all breakfast history for stats
      const allSnap = await getDocs(collection(db, "club_expenses"));
      const all = allSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.type === "BREAKFAST");

      const s = calculatePlayerStats(all);
      setStats(s);

      const next = getNextPayer(players, s);
      setNextPayer(next);
    };

    load();
  }, [players]);

  const getName = (uid) => {
    const p = players.find(p => p.uid === uid);
    return p?.profile?.nickname || p?.name || "Unknown";
  };

  const getReason = (payer) => {
    if (!payer) return "";
    if (payer.totalPaid === 0) {
      return "Never paid till date & alphabetically first among unpaid players.";
    }
    return `Last paid ${dayjs(payer.lastPaidAt).fromNow()} and has low total contribution.`;
  };

  return (
    <Card sx={{ p: 2.5, borderRadius: 3, mb: 2, bgcolor: "#f9fbff" }}>
      <Typography fontWeight="bold" fontSize={16}>
        🍳 Last Breakfast Session
      </Typography>

      {!lastSession && (
        <Typography fontSize={13} color="text.secondary">
          No breakfast sessions yet.
        </Typography>
      )}

      {lastSession && (
        <>
          <Typography fontSize={13} mt={0.5}>
            📅 {dayjs(lastSession.date.toDate()).format("DD MMM YYYY")}
          </Typography>
          {lastSession.venue && (
            <Typography fontSize={13}>
              📍 {lastSession.venue}
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography fontSize={13} fontWeight="bold">
            💳 Paid By:
          </Typography>

          {lastSession.payers?.map(p => (
            <Typography key={p.uid} fontSize={13}>
              • {getName(p.uid)} ₹{p.amount}
            </Typography>
          ))}

          <Typography fontSize={13} mt={0.5}>
            💰 Total: ₹{lastSession.totalAmount}
          </Typography>
          <Typography fontSize={13}>
            👥 Joined: {lastSession.joined?.length || 0}
          </Typography>
        </>
      )}

      <Divider sx={{ my: 1.5 }} />

      {nextPayer && (
        <>
          <Typography fontWeight="bold" fontSize={15}>
            👑 NEXT PAYEE: {getName(nextPayer.uid)}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Reason: {getReason(nextPayer)}
          </Typography>
        </>
      )}
    </Card>
  );
}
