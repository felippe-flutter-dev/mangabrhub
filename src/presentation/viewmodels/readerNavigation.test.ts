import { describe, expect, it } from "vitest";
import { Chapter } from "../../domain/models/Chapter";
import { findAdjacentChapter } from "./readerNavigation";

function chapter(
  id: string,
  number: string,
  scanlationGroupId: string,
  translatedLanguage = "pt-br",
): Chapter {
  return {
    id,
    volume: "1",
    chapter: number,
    title: "",
    translatedLanguage,
    publishAt: "2026-01-01T00:00:00Z",
    pages: 10,
    scanlationGroup: scanlationGroupId,
    scanlationGroupId,
  };
}

describe("findAdjacentChapter", () => {
  it("continua na mesma scan mesmo quando outra scan tem um número intermediário", () => {
    const current = chapter("a-1", "1", "scan-a");
    const chapters = [
      current,
      chapter("b-2", "2", "scan-b"),
      chapter("a-3", "3", "scan-a"),
    ];

    expect(findAdjacentChapter(chapters, current, "next")?.id).toBe("a-3");
  });

  it("troca para outra scan quando a scan atual não tem mais capítulos", () => {
    const current = chapter("a-3", "3", "scan-a");
    const chapters = [
      chapter("a-1", "1", "scan-a"),
      current,
      chapter("b-4", "4", "scan-b"),
    ];

    expect(findAdjacentChapter(chapters, current, "next")?.id).toBe("b-4");
  });

  it("ignora capítulos que não estão em PT-BR", () => {
    const current = chapter("a-1", "1", "scan-a");
    const chapters = [
      current,
      chapter("a-2-pt", "2", "scan-a", "pt"),
      chapter("b-3", "3", "scan-b"),
    ];

    expect(findAdjacentChapter(chapters, current, "next")?.id).toBe("b-3");
  });

  it("aplica a mesma regra ao voltar para o capítulo anterior", () => {
    const current = chapter("a-4", "4", "scan-a");
    const chapters = [
      chapter("b-1", "1", "scan-b"),
      chapter("a-2", "2", "scan-a"),
      current,
    ];

    expect(findAdjacentChapter(chapters, current, "previous")?.id).toBe("a-2");
  });
});
