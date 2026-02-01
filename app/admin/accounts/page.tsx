import { redirect } from 'next/navigation'

export default function AccountsPage() {
  redirect('/admin/members-accounts?tab=accounts')
}
