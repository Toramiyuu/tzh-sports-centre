"use client";

import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

export default function TeacherPage() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Please log in to access your dashboard.
        </p>
      </div>
    );
  }

  return <TeacherDashboard />;
}
