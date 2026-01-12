// List of admin emails that can access the admin panel
export const ADMIN_EMAILS = [
  'harveydavis2610@gmail.com',
]

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
