-- CreateEnum
CREATE TYPE "public"."OrgRole" AS ENUM ('ORG_ADMIN');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('TEAM_ADMIN');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'TEAM_ADMIN';

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_organizationId_fkey";

-- DropIndex
DROP INDEX "public"."Team_name_key";

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."UserOrgRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "public"."OrgRole" NOT NULL,

    CONSTRAINT "UserOrgRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTeamRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL,

    CONSTRAINT "UserTeamRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgRole_userId_orgId_key" ON "public"."UserOrgRole"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeamRole_userId_teamId_key" ON "public"."UserTeamRole"("userId", "teamId");

-- AddForeignKey
ALTER TABLE "public"."UserOrgRole" ADD CONSTRAINT "UserOrgRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOrgRole" ADD CONSTRAINT "UserOrgRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTeamRole" ADD CONSTRAINT "UserTeamRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTeamRole" ADD CONSTRAINT "UserTeamRole_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
