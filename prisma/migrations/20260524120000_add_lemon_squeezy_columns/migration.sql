-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "lemon_squeezy_customer_id" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "lemon_squeezy_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "lemon_squeezy_variant_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lemon_squeezy_subscription_id_key" ON "subscriptions"("lemon_squeezy_subscription_id");
