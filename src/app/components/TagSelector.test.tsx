import { render, screen, fireEvent } from "@testing-library/react";
import { TagSelector } from "./TagSelector";
import { describe, it, expect, vi } from "vitest";

const mockTags = [
  { id: "1", name: "Action", group: "genre" },
  { id: "2", name: "Comedy", group: "genre" },
];

describe("TagSelector", () => {
  it("deve renderizar as tags traduzidas corretamente", () => {
    render(
      <TagSelector
        tags={mockTags}
        selection={{}}
        onToggle={() => {}}
      />
    );

    // "Action" deve ser traduzido para "Ação" via TagLabels
    expect(screen.getByText("Ação")).toBeInTheDocument();
    expect(screen.getByText("Comédia")).toBeInTheDocument();
  });

  it("deve chamar onToggle ao clicar em uma tag", () => {
    const onToggleMock = vi.fn();
    render(
      <TagSelector
        tags={mockTags}
        selection={{}}
        onToggle={onToggleMock}
      />
    );

    const tag = screen.getByText("Ação");
    fireEvent.click(tag);

    expect(onToggleMock).toHaveBeenCalledWith("1");
  });

  it("deve aplicar cores diferentes baseadas no estado da seleção", () => {
    const selection: Record<string, 'include' | 'exclude' | 'neutral'> = {
      "1": "include",
      "2": "exclude"
    };

    render(
      <TagSelector
        tags={mockTags}
        selection={selection}
        onToggle={() => {}}
      />
    );

    const actionTag = screen.getByText("Ação");
    const comedyTag = screen.getByText("Comédia");

    // Verifica se as classes do Tailwind de inclusão/exclusão estão presentes
    expect(actionTag).toHaveClass("bg-green-600");
    expect(comedyTag).toHaveClass("bg-red-600");
  });
});
