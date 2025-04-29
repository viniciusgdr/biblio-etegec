/*
  Warnings:

  - The `available` column on the `books` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "books" DROP COLUMN "available",
ADD COLUMN     "available" INTEGER NOT NULL DEFAULT 1;
