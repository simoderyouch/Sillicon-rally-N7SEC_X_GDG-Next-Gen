import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { game } from "./index";

describe("__GAME_SLUG__ game", () => {
  it("reports a bounded completion score", () => {
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={{ id: "game-id", slug: "__GAME_SLUG__", title: "Starter Game", description: "", maxScore: 100, releaseState: "PUBLISHED" }} onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText("Development score"), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit result" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true }));
  });
});
