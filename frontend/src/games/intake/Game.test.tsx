import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { game } from "./index";

describe("intake game", () => {
  it("awards the mission maximum for escalating the suspicious message", () => {
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={{ id: "intake-id", slug: "intake", title: "Signal Scan", description: "", maxScore: 100, releaseState: "PUBLISHED" }} onComplete={onComplete} />);
    fireEvent.click(screen.getByLabelText(/Treat it as a suspected phishing/i));
    fireEvent.click(screen.getByRole("button", { name: "Submit decision" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true }));
  });
});
