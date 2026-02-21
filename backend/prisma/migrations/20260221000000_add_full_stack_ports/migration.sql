-- AlterTable
ALTER TABLE "managed_sites" ADD COLUMN "npmHttpPort" INTEGER;
ALTER TABLE "managed_sites" ADD COLUMN "npmHttpsPort" INTEGER;
ALTER TABLE "managed_sites" ADD COLUMN "npmAdminPort" INTEGER;
ALTER TABLE "managed_sites" ADD COLUMN "portainerPort" INTEGER;
ALTER TABLE "managed_sites" ADD COLUMN "npmContainerId" TEXT;
ALTER TABLE "managed_sites" ADD COLUMN "npmDbContainerId" TEXT;
ALTER TABLE "managed_sites" ADD COLUMN "portainerContainerId" TEXT;
