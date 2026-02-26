import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import TrainingGroupsContent from "@/components/admin/TrainingGroupsContent";

export default async function TrainingGroupsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/training-groups");
  }

  if (!isAdmin(session.user.email, session.user.isAdmin)) {
    redirect("/");
  }

  return <TrainingGroupsContent />;
}
