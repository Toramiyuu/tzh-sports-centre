// Admin emails loaded from ADMIN_EMAILS env var (comma-separated)
// Example: ADMIN_EMAILS=alice@example.com,bob@example.com
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

// Check if user is admin - via database flag (from session) or env var email list
export function isAdmin(email: string | null | undefined, dbIsAdmin?: boolean): boolean {
  if (dbIsAdmin === true) return true
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

// Check if email is in the superadmin list (from ADMIN_EMAILS env var)
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
