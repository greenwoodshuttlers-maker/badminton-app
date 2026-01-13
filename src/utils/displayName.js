export const getDisplayName = (userDoc) => {
  if (!userDoc) return "";

  return (
    userDoc.profile?.nickname ||
    userDoc.name ||
    userDoc.email ||
    ""
  );
};
