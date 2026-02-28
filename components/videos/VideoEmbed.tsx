"use client";

interface VideoEmbedProps {
  url: string;
  title: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

export function VideoEmbed({ url, title }: VideoEmbedProps) {
  const youtubeId = getYouTubeId(url);
  const instagramId = getInstagramId(url);
  const tiktokId = getTikTokId(url);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  if (instagramId) {
    return (
      <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden">
        <iframe
          src={`https://www.instagram.com/p/${instagramId}/embed`}
          title={title}
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  if (tiktokId) {
    return (
      <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
          title={title}
          allowFullScreen
          className="w-full h-[700px] border-0"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full aspect-video rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
    >
      <div className="text-center">
        <p className="text-sm text-muted-foreground">External Video</p>
        <p className="text-primary text-sm font-medium mt-1">Open in new tab</p>
      </div>
    </a>
  );
}
