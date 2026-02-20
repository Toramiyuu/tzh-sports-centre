import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import LessonTypesContent from "@/components/admin/LessonTypesContent";

export default async function LessonTypesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/lesson-types");
  }

  if (!isAdmin(session.user.email, session.user.isAdmin)) {
    redirect("/");
  }

  return <LessonTypesContent />;
}
