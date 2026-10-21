-- Растяжки: атрибуция фото, видео, «где тянет», источники техники, исходное положение
CREATE TYPE "StretchPosition" AS ENUM ('STANDING', 'KNEELING', 'SITTING', 'LYING');

ALTER TABLE "Stretch"
  ADD COLUMN "imageSource" TEXT,
  ADD COLUMN "imageLicense" TEXT,
  ADD COLUMN "imageAuthor" TEXT,
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "feel" TEXT,
  ADD COLUMN "techniqueSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "position" "StretchPosition";
