-- AlterTable
ALTER TABLE `Product` ADD COLUMN `code` VARCHAR(12) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_code_key` ON `Product`(`code`);
