-- CreateEnum
CREATE TYPE "public"."MarketSignal_signal" AS ENUM ('buy', 'sell', 'neutral');

-- CreateTable
CREATE TABLE "MarketSignal" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "signal" "MarketSignal_signal" NOT NULL,
    "entry" DOUBLE PRECISION NOT NULL,
    "tp" DOUBLE PRECISION NOT NULL,
    "sl" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '8h',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketSignal_symbol_timeframe_generatedAt_key" ON "MarketSignal"("symbol", "timeframe", "generatedAt");

-- CreateIndex
CREATE INDEX "MarketSignal_symbol_timeframe_idx" ON "MarketSignal"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "MarketSignal_generatedAt_idx" ON "MarketSignal"("generatedAt");

-- Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marketsignal_updated_at BEFORE UPDATE ON "MarketSignal"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
