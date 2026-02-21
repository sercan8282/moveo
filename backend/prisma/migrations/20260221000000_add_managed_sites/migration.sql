-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('PENDING', 'DEPLOYING', 'RUNNING', 'STOPPED', 'ERROR');

-- CreateTable
CREATE TABLE "managed_sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "description" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'PENDING',
    "nginxPort" INTEGER NOT NULL,
    "containerPrefix" TEXT NOT NULL,
    "dbPassword" TEXT NOT NULL,
    "jwtSecret" TEXT NOT NULL,
    "nginxContainerId" TEXT,
    "backendContainerId" TEXT,
    "postgresContainerId" TEXT,
    "redisContainerId" TEXT,
    "errorMessage" TEXT,
    "lastHealthCheck" TIMESTAMP(3),
    "adminEmail" TEXT NOT NULL,
    "adminPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managed_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "managed_sites_name_key" ON "managed_sites"("name");

-- CreateIndex
CREATE UNIQUE INDEX "managed_sites_slug_key" ON "managed_sites"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "managed_sites_nginxPort_key" ON "managed_sites"("nginxPort");

-- CreateIndex
CREATE UNIQUE INDEX "managed_sites_containerPrefix_key" ON "managed_sites"("containerPrefix");
