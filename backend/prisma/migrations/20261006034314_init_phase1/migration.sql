-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genres` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `genres_name_key`(`name`),
    UNIQUE INDEX `genres_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movies` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `poster` VARCHAR(191) NULL,
    `format` VARCHAR(191) NOT NULL DEFAULT '2D',
    `runtime` INTEGER NOT NULL DEFAULT 120,
    `rating` DOUBLE NOT NULL DEFAULT 0.0,
    `status` ENUM('coming_soon', 'showing', 'ended') NOT NULL DEFAULT 'showing',
    `releaseDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `movies_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_genres` (
    `movieId` VARCHAR(191) NOT NULL,
    `genreId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`movieId`, `genreId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cinemas` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cinemas_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` VARCHAR(191) NOT NULL,
    `cinemaId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL DEFAULT '2D',
    `capacity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rooms_cinemaId_name_key`(`cinemaId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seats` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `row` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `type` ENUM('standard', 'vip') NOT NULL DEFAULT 'standard',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seats_roomId_row_number_key`(`roomId`, `row`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_genreId_fkey` FOREIGN KEY (`genreId`) REFERENCES `genres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_cinemaId_fkey` FOREIGN KEY (`cinemaId`) REFERENCES `cinemas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
