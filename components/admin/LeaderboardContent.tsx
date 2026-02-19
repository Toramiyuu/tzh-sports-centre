"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, RefreshCw, Loader2, Medal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  avatarUrl: string | null;
  group: string;
  month: string;
  attendancePoints: number;
  gamesPoints: number;
  winsPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

interface Member {
  id: string;
  name: string;
  uid: string;
}

export default function LeaderboardContent() {
  const t = useTranslations("gamification.leaderboard");
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [pointsCategory, setPointsCategory] = useState("bonus");
  const [awarding, setAwarding] = useState(false);

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

  const openPointsDialog = () => {
    setSelectedUserId("");
    setPointsAmount("");
    setPointsReason("");
    setPointsCategory("bonus");
    setMemberSearch("");
    setPointsDialogOpen(true);
    if (members.length === 0) {
      fetch("/api/admin/members")
        .then((r) => r.json())
        .then((data) => setMembers(data.members || []))
        .catch(() => {});
    }
  };

  const handleAwardPoints = async () => {
    if (!selectedUserId || !pointsAmount) return;
    setAwarding(true);
    try {
      const res = await fetch("/api/admin/leaderboard/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          points: Number(pointsAmount),
          month,
          category: pointsCategory,
          reason: pointsReason || null,
        }),
      });
      if (res.ok) {
        setPointsDialogOpen(false);
        fetchLeaderboard();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to award points");
      }
    } catch (error) {
      console.error("Error awarding points:", error);
    } finally {
      setAwarding(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true;
    const s = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(s) || m.uid.toLowerCase().includes(s);
  });

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
        <Button size="sm" onClick={openPointsDialog}>
          <Plus className="w-4 h-4 mr-1" />
          {t("givePoints")}
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

      {/* Give Points Dialog */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("givePoints")}</DialogTitle>
            <DialogDescription>
              Award bonus points to a player for the selected month
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("player")}</Label>
              <Input
                placeholder="Search by name or UID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="mb-2"
              />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredMembers.slice(0, 20).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedUserId(m.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedUserId === m.id
                        ? "bg-primary text-white"
                        : "bg-card border border-border hover:bg-muted"
                    }`}
                  >
                    {m.name} <span className="opacity-60">#{m.uid}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={pointsCategory} onValueChange={setPointsCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">{t("attendance")}</SelectItem>
                  <SelectItem value="games">{t("games")}</SelectItem>
                  <SelectItem value="wins">{t("wins")}</SelectItem>
                  <SelectItem value="bonus">{t("bonus")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder="e.g. 5 or -2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Positive to add, negative to deduct (whole numbers only)
              </p>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="e.g. Tournament winner"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPointsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAwardPoints}
              disabled={
                !selectedUserId ||
                !pointsAmount ||
                Number(pointsAmount) === 0 ||
                awarding
              }
            >
              {awarding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Award Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
