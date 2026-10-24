import { afterEach, describe, expect, it } from "vitest";
import { getTeamName, getTeamSession, getTeamToken, saveTeamSession } from "./teamSession";

afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe("team session storage", () => {
  it("persists a team's identity across browser restarts", () => {
    saveTeamSession("team-token", "Packet Pilots");

    expect(localStorage.getItem("teamToken")).toBe("team-token");
    expect(localStorage.getItem("teamName")).toBe("Packet Pilots");
    expect(getTeamSession()).toEqual({ token: "team-token", teamName: "Packet Pilots" });
  });

  it("migrates an existing tab-only player session without losing its identity", () => {
    sessionStorage.setItem("teamToken", "legacy-token");
    sessionStorage.setItem("teamName", "Legacy Team");

    expect(getTeamToken()).toBe("legacy-token");
    expect(getTeamName()).toBe("Legacy Team");
    expect(localStorage.getItem("teamToken")).toBe("legacy-token");
    expect(localStorage.getItem("teamName")).toBe("Legacy Team");
  });
});
