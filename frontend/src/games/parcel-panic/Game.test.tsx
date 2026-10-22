import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { game } from "./index";

const mission = { id: "game-id", slug: "parcel-panic", title: "Parcel Panic", description: "", maxScore: 100, releaseState: "PUBLISHED" as const };

function routeParcel(name: string, depot: string) {
  fireEvent.click(screen.getByRole("button", { name: `${name} parcel` }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(depot, "i") }));
}

afterEach(cleanup);

describe("parcel-panic game", () => {
  it("awards full points when every parcel is routed without hints or incorrect routes", () => {
    const onComplete = vi.fn();
    const Component = game.component;
    render(<Component mission={mission} onComplete={onComplete} />);
    routeParcel("Comet post", "Express truck"); routeParcel("Bookworm bundle", "Library return"); routeParcel("Seedling crate", "Market cart"); routeParcel("Corner shop order", "Express truck"); routeParcel("Midnight return", "Library return"); routeParcel("Orchard basket", "Market cart"); routeParcel("Archivist note", "Library return"); routeParcel("Festival pass", "Express truck");
    fireEvent.click(screen.getByRole("button", { name: /dispatch parcels/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, completed: true, details: expect.objectContaining({ hintsUsed: 0, incorrectRoutes: 0 }) }));
  });

  it("deducts points when a player opens a hint", () => {
    const Component = game.component;
    render(<Component mission={mission} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use hint 1/i }));
    expect(screen.getByText(/only the stamp chooses the route/i)).toBeInTheDocument();
    expect(screen.getByText(/projected score/i).parentElement).toHaveTextContent("90 pts");
  });
});
