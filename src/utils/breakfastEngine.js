/* ================= NEXT PAYER ENGINE ================= */
import dayjs from "dayjs";

/* ============================================
   📊 Calculate Player Stats from Breakfast History
============================================ */
export const calculatePlayerStats = (expenses) => {
  const stats = {};

  expenses.forEach(exp => {
    exp.payers?.forEach(p => {
      if (!stats[p.uid]) {
        stats[p.uid] = {
          totalPaid: 0,
          lastPaidAt: null,
          count: 0
        };
      }

      stats[p.uid].totalPaid += p.amount;
      stats[p.uid].count += 1;

      const paidDate = p.paidAt?.toDate?.() || p.paidAt;
      if (
        !stats[p.uid].lastPaidAt ||
        dayjs(paidDate).isAfter(stats[p.uid].lastPaidAt)
      ) {
        stats[p.uid].lastPaidAt = paidDate;
      }
    });
  });

  return stats;
};

/* ============================================
   👑 Get Next Payer (Smart Logic)
============================================ */
export const getNextPayer = (players, stats) => {
  if (!players || players.length === 0) return null;

  const enriched = players.map(p => {
    const s = stats[p.uid] || {
      totalPaid: 0,
      lastPaidAt: null,
      count: 0
    };

    return {
      uid: p.uid,
      name: p.profile?.nickname || p.name || "",
      totalPaid: s.totalPaid,
      lastPaidAt: s.lastPaidAt,
      count: s.count
    };
  });

  /* 🥇 RULE 1: Players who NEVER paid → alphabetical order */
  const neverPaid = enriched.filter(p => p.totalPaid === 0);

  if (neverPaid.length > 0) {
    neverPaid.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return neverPaid[0]; // 👈 alphabetical winner
  }

  /* 🥈 RULE 2: Paid longest ago */
  enriched.sort((a, b) => {
    const aDate = a.lastPaidAt ? dayjs(a.lastPaidAt).valueOf() : 0;
    const bDate = b.lastPaidAt ? dayjs(b.lastPaidAt).valueOf() : 0;

    if (aDate !== bDate) return aDate - bDate;

    /* 🥉 RULE 3: Lowest totalPaid */
    return a.totalPaid - b.totalPaid;
  });

  return enriched[0];
};

