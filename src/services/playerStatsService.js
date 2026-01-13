import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================================================
   PLAYER STATS SERVICE
   Phase-2.1 (Read-only aggregation)
   ========================================================= */

/**
 * Fetch archived sessions where user actually played
 */
export const getPlayedSessionsForUser = async (userId) => {
  if (!userId) return [];

  const q = query(
    collection(db, "voting_sessions"),
    where("archived", "==", true)
  );

  const snap = await getDocs(q);

  const sessions = snap.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(session =>
      session.attendance?.playedUserIds?.includes(userId)
    );

  return sessions;
};

/**
 * Build player stats from archived sessions
 */
export const buildPlayerStats = (sessions = []) => {
  if (sessions.length === 0) {
    return {
      gamesPlayed: 0,
      totalSpent: 0,
      avgPerGame: 0,
      firstGameDate: null,
      lastGameDate: null
    };
  }

  let totalSpent = 0;
  let dates = [];

  sessions.forEach(session => {
    const amount = session.booking?.amount || 0;
    const playersCount =
      session.attendance?.playedUserIds?.length || 1;

    // per-head cost
    totalSpent += Math.round(amount / playersCount);

    if (session.eventDate?.toDate) {
      dates.push(session.eventDate.toDate());
    }
  });

  dates.sort((a, b) => a - b);

  const gamesPlayed = sessions.length;
  const avgPerGame = Math.round(totalSpent / gamesPlayed);

  return {
    gamesPlayed,
    totalSpent,
    avgPerGame,
    firstGameDate: dates[0] || null,
    lastGameDate: dates[dates.length - 1] || null
  };
};

/**
 * Convenience helper: fetch + compute in one call
 */
export const getPlayerStats = async (userId) => {
  const sessions = await getPlayedSessionsForUser(userId);
  const stats = buildPlayerStats(sessions);

  return {
    stats,
    sessions
  };
};
