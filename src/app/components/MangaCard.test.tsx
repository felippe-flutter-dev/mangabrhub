import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MangaCard } from "./MangaCard";
import { Manga } from "../../domain/models/Manga";
import { describe, it, expect, afterEach } from "vitest";

const mockManga: Manga = {
  id: "manga-1",
  title: "Test Manga Title",
  description: "Description",
  status: "ongoing",
  contentRating: "safe",
  coverUrl: "https://test.com/cover.jpg",
  rating: 4.5,
  tags: ["Action", "Adventure"],
  availableLanguages: ["pt-br", "en"],
};

describe("MangaCard", () => {
  afterEach(() => {
    cleanup();
  });

  const renderMangaCard = (manga: Manga) => {
    return render(
      <MemoryRouter>
        <MangaCard manga={manga} />
      </MemoryRouter>
    );
  };

  it("deve renderizar o título do mangá corretamente", () => {
    renderMangaCard(mockManga);
    expect(screen.getByText("Test Manga Title")).toBeInTheDocument();
  });

  it("deve renderizar o status do mangá traduzido", () => {
    renderMangaCard(mockManga);
    // 'ongoing' deve ser traduzido para 'Em andamento' pelo MangaStatusLabels
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
  });

  it("deve conter um link para a página de detalhes correta", () => {
    renderMangaCard(mockManga);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/manga/manga-1");
  });

  it("deve exibir a nota do mangá formatada", () => {
    renderMangaCard(mockManga);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("deve exibir o badge 18+ para conteúdo erótico", () => {
    const adultManga = { ...mockManga, contentRating: "erotica" };
    renderMangaCard(adultManga);
    expect(screen.getByText("18+")).toBeInTheDocument();
  });

  it("não deve exibir o badge 18+ para conteúdo livre", () => {
    renderMangaCard(mockManga);
    expect(screen.queryByText("18+")).not.toBeInTheDocument();
  });
});
