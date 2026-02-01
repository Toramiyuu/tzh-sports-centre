import { redirect } from 'next/navigation'

export default function LessonsPage() {
  redirect('/admin/bookings-lessons?tab=lessons')
}
