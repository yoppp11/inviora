-- CreateTable
CREATE TABLE "TransferConfirmation" (
    "id" TEXT NOT NULL,
    "weddingEventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "transferDate" TIMESTAMP(3),
    "notes" TEXT,
    "proofImageUrl" TEXT NOT NULL,
    "proofPublicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferConfirmation_weddingEventId_idx" ON "TransferConfirmation"("weddingEventId");

-- CreateIndex
CREATE INDEX "TransferConfirmation_guestId_idx" ON "TransferConfirmation"("guestId");

-- AddForeignKey
ALTER TABLE "TransferConfirmation" ADD CONSTRAINT "TransferConfirmation_weddingEventId_fkey" FOREIGN KEY ("weddingEventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferConfirmation" ADD CONSTRAINT "TransferConfirmation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
