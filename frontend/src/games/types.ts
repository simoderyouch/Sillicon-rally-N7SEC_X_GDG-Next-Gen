import type { ComponentType } from "react";
import type { Mission } from "../api/types";

export type GameCompletion = {
  score: number;
  completed: boolean;
  details?: Record<string, string | number | boolean>;
};

export type GameProps = {
  mission: Mission;
  onComplete: (result: GameCompletion) => void;
  disabled?: boolean;
};

export type GameDefinition = {
  slug: string;
  component: ComponentType<GameProps>;
};

export type GameModule = { game: GameDefinition };
