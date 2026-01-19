import { redirect } from 'next/navigation'

export default function ManagePaymentsRedirectPage() {
  redirect('/admin/court-management?tab=payments')
}
