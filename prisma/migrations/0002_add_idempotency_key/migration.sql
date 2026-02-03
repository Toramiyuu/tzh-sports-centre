-- AlterTable: Add idempotency_key to payment_transactions
ALTER TABLE "payment_transactions" ADD COLUMN "idempotency_key" TEXT;

-- CreateIndex: Unique constraint on idempotency_key
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");
