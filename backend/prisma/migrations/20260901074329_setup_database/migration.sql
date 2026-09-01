-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OWNER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "ceremonyTime" TEXT,
    "receptionTime" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "mapUrl" TEXT,
    "openingText" TEXT,
    "closingText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "weddingEventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "invitationToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingTemplateConfig" (
    "id" TEXT NOT NULL,
    "weddingEventId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL DEFAULT 'elegant',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingTemplateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "weddingEventId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "width" INTEGER,
    "height" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingEvent_slug_key" ON "WeddingEvent"("slug");

-- CreateIndex
CREATE INDEX "WeddingEvent_userId_idx" ON "WeddingEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_invitationToken_key" ON "Guest"("invitationToken");

-- CreateIndex
CREATE INDEX "Guest_weddingEventId_idx" ON "Guest"("weddingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingTemplateConfig_weddingEventId_key" ON "WeddingTemplateConfig"("weddingEventId");

-- CreateIndex
CREATE INDEX "Media_weddingEventId_idx" ON "Media"("weddingEventId");

-- AddForeignKey
ALTER TABLE "WeddingEvent" ADD CONSTRAINT "WeddingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_weddingEventId_fkey" FOREIGN KEY ("weddingEventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTemplateConfig" ADD CONSTRAINT "WeddingTemplateConfig_weddingEventId_fkey" FOREIGN KEY ("weddingEventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_weddingEventId_fkey" FOREIGN KEY ("weddingEventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
