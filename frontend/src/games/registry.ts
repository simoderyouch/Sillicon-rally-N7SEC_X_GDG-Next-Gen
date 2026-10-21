import type { GameDefinition, GameModule } from "./types";

const modules = import.meta.glob<GameModule>("./*/index.tsx", { eager: true });

export const games = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.includes("/_template/"))
    .map(([, module]) => [module.game.slug, module.game]),
) as Record<string, GameDefinition>;
