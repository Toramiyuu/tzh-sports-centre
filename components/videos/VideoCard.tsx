"use client";

import { Lock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface VideoCardProps {
  video: {
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
  };
  onClick: () => void;
}

function getYouTubeThumbnail(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
}

const categoryColors: Record<string, string> = {
  technique: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  drills: "bg-green-500/10 text-green-600 dark:text-green-400",
  "match-analysis": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  tips: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function VideoCard({ video, onClick }: VideoCardProps) {
  const t = useTranslations("videos");
  const thumbnail =
    video.thumbnailUrl || (video.url ? getYouTubeThumbnail(video.url) : null);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Lock overlay */}
        {video.locked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-white text-sm font-medium">{t("exclusive")}</p>
            </div>
          </div>
        )}

        {/* Play button overlay for unlocked */}
        {!video.locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-0.5" />
            </div>
          </div>
        )}

        {/* Exclusive badge */}
        {video.isExclusive && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
            {t("exclusiveBadge")}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{video.creator.name}</p>
          {video.category && (
            <Badge
              variant="secondary"
              className={`text-xs ${categoryColors[video.category] || ""}`}
            >
              {t(`categories.${video.category}`)}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
