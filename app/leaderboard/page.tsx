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

interface LeaderboardEntry {
  rank: number;
  playerName: string;
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

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return (
      <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    );
  };

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
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {leaderboard.slice(0, 3).map((entry) => (
                  <Card
                    key={entry.rank}
                    className={
                      entry.rank === 1
                        ? "border-yellow-500/50 bg-yellow-500/5"
                        : entry.rank === 2
                          ? "border-gray-400/50 bg-gray-400/5"
                          : "border-amber-700/50 bg-amber-700/5"
                    }
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="flex justify-center mb-2">
                        {getRankDisplay(entry.rank)}
                      </div>
                      <p className="font-semibold text-lg text-foreground">
                        {entry.playerName}
                      </p>
                      <p className="text-3xl font-bold text-primary mt-3">
                        {entry.totalPoints}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("total")} pts
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Full table */}
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium w-16">
                          {t("rank")}
                        </th>
                        <th className="text-left py-2 font-medium">
                          {t("player")}
                        </th>
                        <th className="text-center py-2 font-medium">
                          {t("attendance")}
                        </th>
                        <th className="text-center py-2 font-medium">
                          {t("games")}
                        </th>
                        <th className="text-center py-2 font-medium">
                          {t("wins")}
                        </th>
                        <th className="text-center py-2 font-medium">
                          {t("bonus")}
                        </th>
                        <th className="text-right py-2 font-medium">
                          {t("total")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry) => (
                        <tr
                          key={entry.rank}
                          className={`border-b border-border/50 ${
                            entry.rank <= 3 ? "font-medium" : ""
                          }`}
                        >
                          <td className="py-3">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankDisplay(entry.rank)}
                            </div>
                          </td>
                          <td className="py-3 text-foreground">
                            {entry.playerName}
                          </td>
                          <td className="py-3 text-center">
                            {entry.attendancePoints}
                          </td>
                          <td className="py-3 text-center">
                            {entry.gamesPoints}
                          </td>
                          <td className="py-3 text-center">
                            {entry.winsPoints}
                          </td>
                          <td className="py-3 text-center">
                            {entry.bonusPoints}
                          </td>
                          <td className="py-3 text-right font-bold text-primary">
                            {entry.totalPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
