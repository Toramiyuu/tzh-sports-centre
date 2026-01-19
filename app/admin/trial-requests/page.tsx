import { redirect } from 'next/navigation'

export default function TrialRequestsRedirectPage() {
  redirect('/admin/lessons?tab=requests')
}
