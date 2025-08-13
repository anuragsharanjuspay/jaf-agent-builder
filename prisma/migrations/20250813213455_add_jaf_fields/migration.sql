-- AlterTable
ALTER TABLE "public"."Agent" ADD COLUMN     "handoffs" TEXT[],
ADD COLUMN     "inputGuardrails" JSONB,
ADD COLUMN     "instructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "memoryConfig" JSONB,
ADD COLUMN     "memoryType" TEXT DEFAULT 'in-memory',
ADD COLUMN     "modelConfig" JSONB,
ADD COLUMN     "outputGuardrails" JSONB,
ADD COLUMN     "outputSchema" JSONB;

-- AlterTable
ALTER TABLE "public"."Tool" ADD COLUMN     "schema" JSONB,
ALTER COLUMN "implementation" SET DATA TYPE TEXT;
