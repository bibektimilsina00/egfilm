-- CreateTable
CREATE TABLE "MatchComment" (
    "id" TEXT NOT NULL,
    "matchKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchCommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchComment_matchKey_idx" ON "MatchComment"("matchKey");

-- CreateIndex
CREATE INDEX "MatchComment_userId_idx" ON "MatchComment"("userId");

-- CreateIndex
CREATE INDEX "MatchComment_parentId_idx" ON "MatchComment"("parentId");

-- CreateIndex
CREATE INDEX "MatchComment_createdAt_idx" ON "MatchComment"("createdAt");

-- CreateIndex
CREATE INDEX "MatchCommentReaction_commentId_idx" ON "MatchCommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "MatchCommentReaction_userId_idx" ON "MatchCommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchCommentReaction_commentId_userId_type_key" ON "MatchCommentReaction"("commentId", "userId", "type");

-- AddForeignKey
ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MatchComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCommentReaction" ADD CONSTRAINT "MatchCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MatchComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCommentReaction" ADD CONSTRAINT "MatchCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
