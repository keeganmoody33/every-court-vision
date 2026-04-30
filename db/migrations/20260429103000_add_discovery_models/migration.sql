-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "isPublicFacing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DiscoveredSurface" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "handle" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "discoveryMethod" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "searchQuery" TEXT,
    "searchRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveredSurface_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscoveredSurface_employeeId_surface_handle_key" ON "DiscoveredSurface"("employeeId", "surface", "handle");
CREATE INDEX "DiscoveredSurface_employeeId_idx" ON "DiscoveredSurface"("employeeId");
CREATE INDEX "DiscoveredSurface_surface_idx" ON "DiscoveredSurface"("surface");
CREATE INDEX "DiscoveredSurface_status_idx" ON "DiscoveredSurface"("status");

ALTER TABLE "DiscoveredSurface" ADD CONSTRAINT "DiscoveredSurface_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DiscoveryJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "employeeId" TEXT,
    "surface" TEXT,
    "surfacesFound" INTEGER NOT NULL DEFAULT 0,
    "surfacesUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscoveryJob_status_idx" ON "DiscoveryJob"("status");
CREATE INDEX "DiscoveryJob_employeeId_idx" ON "DiscoveryJob"("employeeId");
