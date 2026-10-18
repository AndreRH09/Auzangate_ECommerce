-- DropIndex
DROP INDEX `Product_status_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `gender` ENUM('UNISEX', 'MEN', 'WOMEN') NOT NULL DEFAULT 'UNISEX';

-- CreateIndex
CREATE INDEX `Product_status_gender_idx` ON `Product`(`status`, `gender`);
