"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, RefreshCw, Loader2, Medal } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  group: string;
  month: string;
  attendancePoints: number;
  gamesPoints: number;
  winsPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export default function LeaderboardContent() {
  const t = useTranslations("gamification.leaderboard");
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leaderboard/full?month=${month}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return (
      <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    );
  };

  const getGroupBadgeVariant = (group: string) => {
    return group === "ELITE" ? ("default" as const) : ("secondary" as const);
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 highlight cards */}
          {leaderboard.length >= 3 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {leaderboard.slice(0, 3).map((entry) => (
                <Card
                  key={entry.userId}
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
                    <Badge
                      variant={getGroupBadgeVariant(entry.group)}
                      className="mt-1"
                    >
                      {entry.group}
                    </Badge>
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
                        key={entry.userId}
                        className={`border-b border-border/50 ${
                          entry.rank <= 3 ? "font-medium" : ""
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankDisplay(entry.rank)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">
                              {entry.playerName}
                            </span>
                            <Badge
                              variant={getGroupBadgeVariant(entry.group)}
                              className="text-xs"
                            >
                              {entry.group}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {entry.attendancePoints}
                        </td>
                        <td className="py-3 text-center">
                          {entry.gamesPoints}
                        </td>
                        <td className="py-3 text-center">{entry.winsPoints}</td>
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
        </>
      )}
    </div>
  );
}
