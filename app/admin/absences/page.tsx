"use client";

import { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const AbsencesContent = dynamic(
  () => import("@/components/admin/AbsencesContent"),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

function AbsencesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("absence");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("admin.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.description")}</p>
          </div>
        </div>
        <AbsencesContent />
      </div>
    </div>
  );
}

export default function AbsencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AbsencesPageContent />
    </Suspense>
  );
}
