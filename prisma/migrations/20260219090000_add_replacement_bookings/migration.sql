-- CreateEnum
CREATE TYPE "ReplacementBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "replacement_bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "replacement_credit_id" TEXT NOT NULL,
    "lesson_session_id" TEXT NOT NULL,
    "status" "ReplacementBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replacement_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "replacement_bookings_replacement_credit_id_key" ON "replacement_bookings"("replacement_credit_id");

-- CreateIndex
CREATE INDEX "replacement_bookings_user_id_idx" ON "replacement_bookings"("user_id");

-- CreateIndex
CREATE INDEX "replacement_bookings_lesson_session_id_idx" ON "replacement_bookings"("lesson_session_id");

-- AddForeignKey
ALTER TABLE "replacement_bookings" ADD CONSTRAINT "replacement_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_bookings" ADD CONSTRAINT "replacement_bookings_replacement_credit_id_fkey" FOREIGN KEY ("replacement_credit_id") REFERENCES "replacement_credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_bookings" ADD CONSTRAINT "replacement_bookings_lesson_session_id_fkey" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
