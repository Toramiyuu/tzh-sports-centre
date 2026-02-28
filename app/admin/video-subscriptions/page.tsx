"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { VideoSubscriptionsTab } from "@/components/admin/VideoSubscriptionsTab";
import { VideoUploadDialog } from "@/components/videos/VideoUploadDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  category?: string | null;
  isExclusive: boolean;
  creator: { name: string };
  createdAt: string;
}

export default function VideoSubscriptionsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations("admin");
  const tV = useTranslations("videos");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      if (res.ok) {
        setVideos(await res.json());
      }
    } catch {
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(tV("admin.videoDeleted"));
      fetchVideos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Link href="/admin">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToAdmin")}
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t("videoSubscriptions.title")}
        </h1>

        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-6">
            <TabsTrigger value="subscriptions">
              {t("videoSubscriptions.subscriptionsTab")}
            </TabsTrigger>
            <TabsTrigger value="videos">
              {t("videoSubscriptions.videosTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <VideoSubscriptionsTab />
          </TabsContent>

          <TabsContent value="videos">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("videoSubscriptions.videosCount", {
                    count: videos.length,
                  })}
                </p>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("videoSubscriptions.addVideo")}
                </Button>
              </div>

              {loadingVideos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("videoSubscriptions.noVideos")}
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">
                            {video.title}
                          </p>
                          {video.isExclusive && (
                            <Badge className="bg-amber-500 text-white text-xs shrink-0">
                              Premium
                            </Badge>
                          )}
                          {video.category && (
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0"
                            >
                              {tV(`categories.${video.category}`)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.url}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.creator.name} ·{" "}
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 shrink-0"
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingId === video.id}
                      >
                        {deletingId === video.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <VideoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchVideos}
      />
    </div>
  );
}
