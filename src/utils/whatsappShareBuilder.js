export const buildWhatsAppMessage = (session, playersMap = {}) => {

  // 🏸 PREMIUM SEPARATORS
  const SEP = "🏸━━━━━━━━━━━━🏸";
  const MINI = "──────────";

  const title = session.title || "Badminton";
  const date =
    session.eventDate?.toDate?.().toDateString() || "";

  const venue = session.booking?.venue || "";
  const amount = session.booking?.amount || 0;

  const votes = session._votes || [];

  const getName = uid => {
    const u = playersMap[uid];
    if (!u) return null;
    return u.profile?.nickname || u.name || null;
  };

  const isOnVacation = (user, eventDate) => {
    const ua = user?.profile?.unavailability;
    if (!ua?.from || !ua?.to || !eventDate) return false;

    const d = eventDate.toDate
      ? eventDate.toDate()
      : new Date(eventDate);

    return d >= ua.from.toDate() &&
           d <= ua.to.toDate();
  };

  const activeIds = Object.keys(playersMap).filter(
    uid => !isOnVacation(playersMap[uid], session.eventDate)
  );

  const validVotes = votes.filter(v =>
    !isOnVacation(playersMap[v.userId], session.eventDate)
  );

  const playing = validVotes
    .filter(v => v.vote === "PLAYING")
    .map(v => getName(v.userId))
    .filter(Boolean);

  const notPlaying = validVotes
    .filter(v => v.vote === "NOT_PLAYING")
    .map(v => getName(v.userId))
    .filter(Boolean);

  const votedIds = validVotes.map(v => v.userId);

  const didntVote = activeIds
    .filter(uid => !votedIds.includes(uid))
    .map(getName)
    .filter(Boolean);

  const playedIds =
    (session.attendance?.playedUserIds || [])
      .filter(uid =>
        !isOnVacation(playersMap[uid], session.eventDate)
      );

  const playedNames = playedIds
    .map(getName)
    .filter(Boolean);

  const perHead =
    playedIds.length
      ? Math.round(amount / playedIds.length)
      : 0;

  const attendanceSaved =
    session.attendanceSaved === true;

  let msg = "";

  // 🟢 STAGE 1
  if (validVotes.length === 0 && session.status === "OPEN") {
    msg =
`🏸 *${title}*
📅 ${date}
🗳 Voting Open
${SEP}`;

    return encodeURIComponent(msg.trim());
  }

  // 🟡 STAGE 2
  if (session.status === "OPEN") {
    msg =
`🏸 *${title}*
📅 ${date}
${SEP}
✅ Playing (${playing.length})
${playing.join(", ") || "-"}
${MINI}
❌ Not Playing (${notPlaying.length})
${notPlaying.join(", ") || "-"}
${MINI}
⏳ Didn’t Vote (${didntVote.length})
${didntVote.join(", ") || "-"}`;

    return encodeURIComponent(msg.trim());
  }

  // 🔵 STAGE 3
  if (session.status === "CLOSED" && !attendanceSaved) {
    msg =
`🏸 *${title}*
📅 ${date}${venue ? `\n📍 ${venue}` : ""}${amount ? `\n💰 ₹${amount}` : ""}
${SEP}
🎾 Playing (${playing.length})
${playing.join(", ") || "-"}`;

    return encodeURIComponent(msg.trim());
  }

  // 🟤 FINAL
  if (attendanceSaved) {
    msg =
`🏸 *${title} — FINAL*
📅 ${date}${venue ? `\n📍 ${venue}` : ""}${amount ? `\n💰 ₹${amount}` : ""}
👤 Per Head ₹${perHead}
${SEP}
✅ Played (${playedNames.length})
${playedNames.join(", ") || "-"}
🙌 Thanks everyone!`;

    return encodeURIComponent(msg.trim());
  }

  return "";
};
