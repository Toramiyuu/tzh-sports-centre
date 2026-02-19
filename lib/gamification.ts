import { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const POINTS = {
  ATTENDANCE: 1.0,
  GAME_PLAYED: 0.5,
  GAME_WON: 1.0,
  STREAK_BONUS: 0,
} as const;

const ELITE_THRESHOLD = {
  WIN_RATE: 0.6,
  MIN_GAMES: 8,
  LAST_N_SESSIONS: 10,
} as const;

/**
 * Recalculate monthly points for a user based on raw attendance and match data.
 * Month must be derived from GameSession.date, never from the current system date.
 */
export async function recalculateMonthlyPoints(
  userId: string,
  month: string,
  tx: TxClient,
) {
  const [yearStr, monthStr] = month.split("-");
  const startDate = new Date(`${yearStr}-${monthStr}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);

  const attendanceCount = await tx.sessionAttendance.count({
    where: {
      userId,
      session: {
        date: { gte: startDate, lt: endDate },
      },
    },
  });

  const matchResults = await tx.matchPlayer.findMany({
    where: {
      userId,
      match: {
        session: {
          date: { gte: startDate, lt: endDate },
        },
      },
    },
    select: { isWinner: true },
  });

  const gamesPlayed = matchResults.length;
  const gamesWon = matchResults.filter((m) => m.isWinner).length;

  const attendancePoints = attendanceCount * POINTS.ATTENDANCE;
  const gamesPoints = gamesPlayed * POINTS.GAME_PLAYED;
  const winsPoints = gamesWon * POINTS.GAME_WON;
  const existing = await tx.playerPoints.findUnique({
    where: { userId_month: { userId, month } },
    select: { bonusPoints: true },
  });
  const bonusPoints = existing?.bonusPoints ?? 0;
  const totalPoints = attendancePoints + gamesPoints + winsPoints + bonusPoints;

  await tx.playerPoints.upsert({
    where: { userId_month: { userId, month } },
    update: {
      attendancePoints,
      gamesPoints,
      winsPoints,
      bonusPoints,
      totalPoints,
    },
    create: {
      userId,
      month,
      attendancePoints,
      gamesPoints,
      winsPoints,
      bonusPoints,
      totalPoints,
    },
  });
}

/**
 * Update player group based on win rate in last N sessions.
 * Always writes stats (winRate, totalGames, totalWins) to PlayerProfile.
 * Skips group field update only if groupOverride is true.
 * Uses upsert to create profile with ACTIVE defaults if none exists.
 */
export async function updatePlayerGroup(userId: string, tx: TxClient) {
  const recentSessions = await tx.gameSession.findMany({
    where: {
      attendances: { some: { userId } },
    },
    orderBy: { date: "desc" },
    take: ELITE_THRESHOLD.LAST_N_SESSIONS,
    select: { id: true },
  });

  const sessionIds = recentSessions.map((s) => s.id);

  const matchResults = await tx.matchPlayer.findMany({
    where: {
      userId,
      match: { sessionId: { in: sessionIds.length > 0 ? sessionIds : [""] } },
    },
    select: { isWinner: true, match: { select: { sessionId: true } } },
  });

  const totalGames = matchResults.length;
  const totalWins = matchResults.filter((m) => m.isWinner).length;
  const winRate = totalGames > 0 ? totalWins / totalGames : 0;

  const isEliteEligible =
    totalGames >= ELITE_THRESHOLD.MIN_GAMES &&
    winRate >= ELITE_THRESHOLD.WIN_RATE;

  const group = isEliteEligible ? "ELITE" : "ACTIVE";

  const existing = await tx.playerProfile.findUnique({
    where: { userId },
    select: { groupOverride: true },
  });

  const shouldUpdateGroup = !existing?.groupOverride;

  await tx.playerProfile.upsert({
    where: { userId },
    update: {
      winRate,
      totalGames,
      totalWins,
      ...(shouldUpdateGroup ? { group } : {}),
    },
    create: {
      userId,
      group,
      groupOverride: false,
      winRate,
      totalGames,
      totalWins,
    },
  });
}
