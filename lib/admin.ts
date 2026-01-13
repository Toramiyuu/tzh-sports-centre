// List of admin emails that can access the admin panel (hardcoded superadmins)
export const ADMIN_EMAILS = [
  'harveydavis2610@gmail.com',
  'zihann00@gmail.com',
]

// Check if user is admin - either via hardcoded list or database flag
export function isAdmin(email: string | null | undefined, dbIsAdmin?: boolean): boolean {
  // Check database flag first (if provided)
  if (dbIsAdmin === true) return true
  // Fall back to hardcoded list
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Check if email is in the hardcoded superadmin list (cannot be removed)
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
