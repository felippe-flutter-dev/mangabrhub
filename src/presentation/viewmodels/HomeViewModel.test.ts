import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useHomeViewModel } from "./HomeViewModel";
import { mangaRepository } from "../../app/di";
import { onAuthStateChanged } from "../../app/lib/firebase";

// Mock das dependências
vi.mock("../../app/di", () => ({
  mangaRepository: {
    getPopularMangas: vi.fn(),
    getLatestMangas: vi.fn(),
    getTopRatedMangas: vi.fn(),
  },
}));

vi.mock("../../app/lib/firebase", () => ({
  auth: {},
  onAuthStateChanged: vi.fn(),
}));

describe("HomeViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for onAuthStateChanged to prevent errors
    (onAuthStateChanged as any).mockReturnValue(vi.fn());
  });

  it("deve iniciar com estado de carregamento e listas vazias", () => {
    const { result } = renderHook(() => useHomeViewModel());

    expect(result.current.loading).toBe(true);
    expect(result.current.popular).toEqual([]);
    expect(result.current.latest).toEqual([]);
    expect(result.current.topRated).toEqual([]);
  });

  it("deve carregar os dados com sucesso ao iniciar", async () => {
    const mockMangas = [{ id: "1", title: "Manga Teste" }];
    (mangaRepository.getPopularMangas as any).mockResolvedValue(mockMangas);
    (mangaRepository.getLatestMangas as any).mockResolvedValue(mockMangas);
    (mangaRepository.getTopRatedMangas as any).mockResolvedValue(mockMangas);

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.popular).toEqual(mockMangas);
    expect(result.current.latest).toEqual(mockMangas);
    expect(result.current.topRated).toEqual(mockMangas);
    expect(result.current.error).toBeNull();
  });

  it("deve tratar erros no carregamento de dados", async () => {
    (mangaRepository.getPopularMangas as any).mockRejectedValue(new Error("Erro API"));

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.");
  });

  it("deve atualizar o usuário quando o estado de autenticação mudar", async () => {
    let authCallback: any;
    (onAuthStateChanged as any).mockImplementation((_auth: any, callback: any) => {
      authCallback = callback;
      return vi.fn(); // Unsubscribe
    });

    const { result } = renderHook(() => useHomeViewModel());

    const mockUser = { uid: "123", displayName: "Usuário Teste" };

    act(() => {
      authCallback(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });
});
