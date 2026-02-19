-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('APPLY', 'LATE_NOTICE', 'ABSENT', 'MEDICAL');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('APPROVED', 'RECORDED', 'PENDING_REVIEW', 'REVIEWED');

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_session_id" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'APPROVED',
    "reason" TEXT,
    "proof_url" TEXT,
    "admin_notes" TEXT,
    "credit_awarded" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "lesson_date" TIMESTAMP(3) NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replacement_credits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "absence_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replacement_credits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absences_user_id_idx" ON "absences"("user_id");

-- CreateIndex
CREATE INDEX "absences_lesson_session_id_idx" ON "absences"("lesson_session_id");

-- CreateIndex
CREATE INDEX "absences_type_idx" ON "absences"("type");

-- CreateIndex
CREATE INDEX "absences_status_idx" ON "absences"("status");

-- CreateIndex
CREATE UNIQUE INDEX "absences_user_id_lesson_session_id_key" ON "absences"("user_id", "lesson_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "replacement_credits_absence_id_key" ON "replacement_credits"("absence_id");

-- CreateIndex
CREATE INDEX "replacement_credits_user_id_idx" ON "replacement_credits"("user_id");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_lesson_session_id_fkey" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_credits" ADD CONSTRAINT "replacement_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_credits" ADD CONSTRAINT "replacement_credits_absence_id_fkey" FOREIGN KEY ("absence_id") REFERENCES "absences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
