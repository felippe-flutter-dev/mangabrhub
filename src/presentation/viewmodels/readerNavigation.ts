import { Chapter } from "../../domain/models/Chapter";

type Direction = "next" | "previous";

function parseChapterNumber(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function comparePublishDate(a: Chapter, b: Chapter): number {
  const aTime = a.publishAt ? Date.parse(a.publishAt) : 0;
  const bTime = b.publishAt ? Date.parse(b.publishAt) : 0;

  return bTime - aTime;
}

function belongsToSameScan(candidate: Chapter, current: Chapter): boolean {
  if (
    current.scanlationGroupId &&
    candidate.scanlationGroupId
  ) {
    return current.scanlationGroupId === candidate.scanlationGroupId;
  }

  if (current.scanlationGroup && candidate.scanlationGroup) {
    return current.scanlationGroup === candidate.scanlationGroup;
  }

  return false;
}

/**
 * Escolhe o capítulo adjacente ao atual, mantendo a mesma scan sempre que
 * ela tiver outro capítulo disponível. Só troca de scan quando não existe
 * mais capítulo naquela scan, e todos os candidatos já chegam filtrados em
 * PT-BR pelo repositório.
 */
export function findAdjacentChapter(
  chapters: Chapter[],
  currentChapter: Chapter,
  direction: Direction,
): Chapter | null {
  const currentNumber = parseChapterNumber(currentChapter.chapter);
  if (currentNumber === null) return null;

  const candidates = chapters
    .filter((candidate) => {
      if (candidate.id === currentChapter.id) return false;
      if (candidate.translatedLanguage !== "pt-br") return false;

      const candidateNumber = parseChapterNumber(candidate.chapter);
      if (candidateNumber === null) return false;

      return direction === "next"
        ? candidateNumber > currentNumber
        : candidateNumber < currentNumber;
    })
    .map((candidate) => ({
      chapter: candidate,
      number: parseChapterNumber(candidate.chapter) as number,
    }));

  if (candidates.length === 0) return null;

  const sameScanCandidates = candidates.filter(({ chapter }) =>
    belongsToSameScan(chapter, currentChapter),
  );
  const prioritizedCandidates =
    sameScanCandidates.length > 0 ? sameScanCandidates : candidates;

  const adjacentNumber = prioritizedCandidates.reduce((selected, candidate) => {
    if (direction === "next") {
      return Math.min(selected, candidate.number);
    }
    return Math.max(selected, candidate.number);
  }, prioritizedCandidates[0].number);

  const adjacentCandidates = prioritizedCandidates
    .filter((candidate) => candidate.number === adjacentNumber)
    .sort((a, b) => {
      const byPublishDate = comparePublishDate(a.chapter, b.chapter);
      if (byPublishDate !== 0) return byPublishDate;

      return a.chapter.id.localeCompare(b.chapter.id);
    });

  return adjacentCandidates[0]?.chapter ?? null;
}
