// Legacy hardcoded admin emails — kept as fallback for sessions created before
// the isAdmin DB field was added to the JWT token. Remove after all users have
// re-authenticated.
const LEGACY_ADMIN_EMAILS = [
  'harveydavis2610@gmail.com',
  'zihann00@gmail.com',
  'lynn-nice-day@hotmail.com',
]

// Check if user is admin - via database flag (from session) or legacy email list
export function isAdmin(email: string | null | undefined, dbIsAdmin?: boolean): boolean {
  if (dbIsAdmin === true) return true
  if (!email) return false
  return LEGACY_ADMIN_EMAILS.includes(email.toLowerCase())
}

// Check if email is in the hardcoded superadmin list (cannot be removed via DB)
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return LEGACY_ADMIN_EMAILS.includes(email.toLowerCase())
}
