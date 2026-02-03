-- CreateIndex (partial unique index - only constrains active bookings)
CREATE UNIQUE INDEX "booking_slot_active" ON "bookings" ("court_id", "booking_date", "start_time")
WHERE "status" NOT IN ('cancelled', 'expired');
