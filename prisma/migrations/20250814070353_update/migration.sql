-- AlterTable
ALTER TABLE "public"."AuditLog" ALTER COLUMN "actorUserId" SET DEFAULT 'ANONYMOUS';

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "public"."AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "public"."AuditLog"("targetType", "targetId");
