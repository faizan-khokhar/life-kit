/** Change this one value to tune Hardest move timer. */
export const HARDEST_MOVE_TIME_MS = 20_000;

export type Difficulty = "normal" | "hard" | "hardest";

export type DifficultyConfig = {
  id: Difficulty;
  label: string;
  /** Probability of spawning a 4 when not using hostile value pick. */
  fourChance: number;
  hostileCell: boolean;
  hostileValue: boolean;
  timed: boolean;
};

export const DIFFICULTIES: Difficulty[] = ["normal", "hard", "hardest"];

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: "normal",
    label: "Normal",
    fourChance: 0.1,
    hostileCell: false,
    hostileValue: false,
    timed: false,
  },
  hard: {
    id: "hard",
    label: "Hard",
    fourChance: 0.25,
    hostileCell: true,
    hostileValue: false,
    timed: false,
  },
  hardest: {
    id: "hardest",
    label: "Hardest",
    fourChance: 0.4,
    hostileCell: true,
    hostileValue: true,
    timed: true,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return value === "normal" || value === "hard" || value === "hardest";
}
