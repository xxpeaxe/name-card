const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}
