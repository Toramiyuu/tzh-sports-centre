"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import { SubscriptionCTA } from "@/components/videos/SubscriptionCTA";
import { SubscriptionPaymentDialog } from "@/components/videos/SubscriptionPaymentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Video } from "lucide-react";
import { useTranslations } from "next-intl";

interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  isExclusive: boolean;
  locked: boolean;
  creator: { name: string; avatarUrl?: string | null };
  createdAt: string;
}

interface SubscriptionStatus {
  status: string;
  expiryDate?: string | null;
}

const CATEGORIES = ["all", "technique", "drills", "match-analysis", "tips"];

export default function VideosPage() {
  const { data: session } = useSession();
  const t = useTranslations("videos");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    status: "none",
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      if (res.ok) {
        setVideos(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/videos/subscription");
      if (res.ok) {
        setSubscription(await res.json());
      }
    } catch {}
  }, [session?.user]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const filteredVideos =
    selectedCategory === "all"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  const handleVideoClick = (video: VideoItem) => {
    if (video.locked) {
      setPaymentDialogOpen(true);
    } else {
      setSelectedVideo(video);
    }
  };

  const handleSubscriptionSuccess = () => {
    fetchSubscription();
    fetchVideos();
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
        </div>

        {/* Subscription CTA */}
        {session?.user && subscription.status !== "active" && (
          <div className="mb-6">
            <SubscriptionCTA
              subscriptionStatus={subscription.status}
              expiryDate={subscription.expiryDate}
              onSubscribe={() => setPaymentDialogOpen(true)}
            />
          </div>
        )}

        {/* Active subscription banner */}
        {subscription.status === "active" && (
          <div className="mb-6">
            <SubscriptionCTA
              subscriptionStatus={subscription.status}
              expiryDate={subscription.expiryDate}
              onSubscribe={() => {}}
            />
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Video grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-24">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("noVideos")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video player dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVideo && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedVideo.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedVideo.url && (
                  <VideoEmbed
                    url={selectedVideo.url}
                    title={selectedVideo.title}
                  />
                )}
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedVideo.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("by")} {selectedVideo.creator.name}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <SubscriptionPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
