-- CreateTable
CREATE TABLE "public"."TryOuts" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOuts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TryOuts" ADD CONSTRAINT "TryOuts_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
