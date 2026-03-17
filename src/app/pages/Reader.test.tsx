import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import Reader from "./Reader";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReaderViewModel } from "../../presentation/viewmodels/ReaderViewModel";

// Mock do ViewModel
vi.mock("../../presentation/viewmodels/ReaderViewModel", () => ({
  useReaderViewModel: vi.fn(),
}));

// Mock do useNavigate do react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock do Firebase para evitar erros de Analytics no ambiente de teste
vi.mock("../lib/firebase", () => ({
  auth: {
    currentUser: null,
  },
  onAuthStateChanged: vi.fn(() => vi.fn()), // Retorna uma função de unsubscribe vazia
}));

describe("Reader Navigation", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it("deve voltar para a página do mangá quando o ID do mangá estiver disponível", () => {
    (useReaderViewModel as any).mockReturnValue({
      manga: { id: "manga-id-123", title: "Test Manga" },
      chapter: { chapter: "1", title: "Cap 1" },
      pages: ["p1.jpg"],
      loading: false,
      error: null,
      mode: "paged",
      currentPage: 0,
      setCurrentPage: vi.fn(),
      constructPageUrl: (p: string) => p,
      markAsRead: vi.fn(),
      refreshImageServer: vi.fn(),
      setMode: vi.fn(),
      setQuality: vi.fn(),
      quality: "original"
    });

    render(
      <MemoryRouter>
        <Reader />
      </MemoryRouter>
    );

    const backButton = screen.getByLabelText("Voltar");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/manga/manga-id-123", { replace: true });
  });

  it("deve usar o histórico (navigate -1) como fallback se o mangá não estiver carregado", () => {
    (useReaderViewModel as any).mockReturnValue({
      manga: null,
      chapter: null,
      pages: ["p1.jpg"],
      loading: false,
      error: null,
      mode: "paged",
      currentPage: 0,
      setCurrentPage: vi.fn(),
      constructPageUrl: (p: string) => p,
      markAsRead: vi.fn(),
      refreshImageServer: vi.fn(),
      setMode: vi.fn(),
      setQuality: vi.fn(),
      quality: "original"
    });

    render(
      <MemoryRouter>
        <Reader />
      </MemoryRouter>
    );

    const backButton = screen.getByLabelText("Voltar");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
