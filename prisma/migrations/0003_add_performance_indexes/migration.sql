-- CreateIndex: Add performance indexes for frequently-queried fields

-- Booking indexes
CREATE INDEX IF NOT EXISTS "bookings_booking_date_idx" ON "bookings"("booking_date");
CREATE INDEX IF NOT EXISTS "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");

-- RecurringBooking indexes
CREATE INDEX IF NOT EXISTS "recurring_bookings_day_of_week_idx" ON "recurring_bookings"("day_of_week");
CREATE INDEX IF NOT EXISTS "recurring_bookings_user_id_idx" ON "recurring_bookings"("user_id");
CREATE INDEX IF NOT EXISTS "recurring_bookings_is_active_idx" ON "recurring_bookings"("is_active");

-- RecurringBookingPayment indexes
CREATE INDEX IF NOT EXISTS "recurring_booking_payments_month_year_idx" ON "recurring_booking_payments"("month", "year");
CREATE INDEX IF NOT EXISTS "recurring_booking_payments_status_idx" ON "recurring_booking_payments"("status");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
