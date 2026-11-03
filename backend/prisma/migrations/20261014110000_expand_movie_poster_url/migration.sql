-- Poster URLs can be substantially longer than 191 characters, especially
-- when sourced from CDN providers.  Preserve the complete URL submitted by
-- the admin form.
ALTER TABLE `movies` MODIFY `poster` TEXT NULL;
