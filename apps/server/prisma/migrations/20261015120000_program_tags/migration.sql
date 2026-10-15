-- CreateTable
CREATE TABLE "ProgramTag" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProgramTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramToProgramTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProgramToProgramTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTag_code_key" ON "ProgramTag"("code");

-- CreateIndex
CREATE INDEX "ProgramTag_position_idx" ON "ProgramTag"("position");

-- CreateIndex
CREATE INDEX "_ProgramToProgramTag_B_index" ON "_ProgramToProgramTag"("B");

-- AddForeignKey
ALTER TABLE "_ProgramToProgramTag" ADD CONSTRAINT "_ProgramToProgramTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToProgramTag" ADD CONSTRAINT "_ProgramToProgramTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

