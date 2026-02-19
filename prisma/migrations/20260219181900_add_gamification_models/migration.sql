-- CreateEnum
CREATE TYPE "PlayerGroup" AS ENUM ('ELITE', 'ACTIVE');

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "court_id" INTEGER,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendances" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "match_number" INTEGER NOT NULL,
    "team1_score" INTEGER NOT NULL,
    "team2_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team" INTEGER NOT NULL,
    "is_winner" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_points" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "attendance_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "games_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wins_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group" "PlayerGroup" NOT NULL DEFAULT 'ACTIVE',
    "group_override" BOOLEAN NOT NULL DEFAULT false,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "consecutive_weeks" INTEGER NOT NULL DEFAULT 0,
    "last_session_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_sessions_date_idx" ON "game_sessions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendances_session_id_user_id_key" ON "session_attendances"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "session_attendances_user_id_idx" ON "session_attendances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_session_id_match_number_key" ON "matches"("session_id", "match_number");

-- CreateIndex
CREATE INDEX "matches_session_id_idx" ON "matches"("session_id");

-- CreateIndex
CREATE INDEX "match_players_match_id_idx" ON "match_players"("match_id");

-- CreateIndex
CREATE INDEX "match_players_user_id_idx" ON "match_players"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_points_user_id_month_key" ON "player_points"("user_id", "month");

-- CreateIndex
CREATE INDEX "player_points_month_idx" ON "player_points"("month");

-- CreateIndex
CREATE UNIQUE INDEX "player_profiles_user_id_key" ON "player_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_points" ADD CONSTRAINT "player_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
