-- CreateEnum
CREATE TYPE "public"."OrgStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "status" "public"."OrgStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "status" "public"."OrgStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
