-- Store the canonical 11-character YouTube video identifier for each movie.
ALTER TABLE `movies` ADD COLUMN `trailerYoutubeId` VARCHAR(20) NULL;
