"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, RefreshCw, Loader2, Medal } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  avatarUrl: string | null;
  attendancePoints: number;
  gamesPoints: number;
  winsPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("gamification.leaderboard");
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/login?callbackUrl=/leaderboard");
    }
  }, [session, status, router]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?month=${month}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (session?.user) fetchLeaderboard();
  }, [session, fetchLeaderboard]);

  if (status === "loading" || (loading && leaderboard.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">
              Monthly player rankings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div>
            <Label>{t("month")}</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            className="mt-5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t("empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Podium: 2nd - 1st - 3rd */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-3 sm:gap-4 pt-6 pb-2">
                {/* 2nd place */}
                <div className="flex flex-col items-center w-28 sm:w-32">
                  {leaderboard[1].avatarUrl ? (
                    <Image
                      src={leaderboard[1].avatarUrl}
                      alt={leaderboard[1].playerName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover mb-1"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-400/20 flex items-center justify-center text-gray-400 font-bold text-lg mb-1">
                      {leaderboard[1].playerName.charAt(0)}
                    </div>
                  )}
                  <Medal className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="font-semibold text-sm sm:text-base text-foreground text-center truncate w-full">
                    {leaderboard[1].playerName}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                    {leaderboard[1].totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("total")} pts
                  </p>
                  <div className="w-full h-24 sm:h-28 bg-gray-400/15 rounded-t-lg mt-3 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400">2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center w-32 sm:w-36">
                  {leaderboard[0].avatarUrl ? (
                    <Image
                      src={leaderboard[0].avatarUrl}
                      alt={leaderboard[0].playerName}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover mb-1"
                      unoptimized
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold text-xl mb-1">
                      {leaderboard[0].playerName.charAt(0)}
                    </div>
                  )}
                  <Medal className="w-8 h-8 text-yellow-500 mb-1" />
                  <p className="font-bold text-base sm:text-lg text-foreground text-center truncate w-full">
                    {leaderboard[0].playerName}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">
                    {leaderboard[0].totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("total")} pts
                  </p>
                  <div className="w-full h-32 sm:h-40 bg-yellow-500/15 rounded-t-lg mt-3 flex items-center justify-center">
                    <span className="text-4xl font-bold text-yellow-500">
                      1
                    </span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center w-28 sm:w-32">
                  {leaderboard[2].avatarUrl ? (
                    <Image
                      src={leaderboard[2].avatarUrl}
                      alt={leaderboard[2].playerName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover mb-1"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-700/20 flex items-center justify-center text-amber-700 font-bold text-lg mb-1">
                      {leaderboard[2].playerName.charAt(0)}
                    </div>
                  )}
                  <Medal className="w-6 h-6 text-amber-700 mb-1" />
                  <p className="font-semibold text-sm sm:text-base text-foreground text-center truncate w-full">
                    {leaderboard[2].playerName}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                    {leaderboard[2].totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("total")} pts
                  </p>
                  <div className="w-full h-16 sm:h-20 bg-amber-700/15 rounded-t-lg mt-3 flex items-center justify-center">
                    <span className="text-3xl font-bold text-amber-700">3</span>
                  </div>
                </div>
              </div>
            )}

            {/* List from 4th onwards */}
            {leaderboard.length > 3 && (
              <Card>
                <CardContent className="pt-4 pb-2">
                  <div className="divide-y divide-border/50">
                    {leaderboard.slice(3).map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center py-3 gap-3"
                      >
                        <span className="w-8 text-center text-sm font-medium text-muted-foreground">
                          {entry.rank}
                        </span>
                        <span className="flex-1 text-foreground font-medium truncate">
                          {entry.playerName}
                        </span>
                        <span className="font-bold text-primary">
                          {entry.totalPoints}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            pts
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
