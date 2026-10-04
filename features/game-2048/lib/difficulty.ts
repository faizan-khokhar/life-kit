/** Change this one value to tune Hardest move timer. */
export const HARDEST_MOVE_TIME_MS = 20_000;

/**
 * Max tile exponent for Random start (value = 2^exp).
 * Raise this freely — not a gameplay “cap”, just avoids absurd float sizes.
 */
export const RANDOM_START_MAX_EXPONENT = 16; // up to 65536

export type Difficulty = "normal" | "hard" | "hardest" | "random";

export type DifficultyConfig = {
  id: Difficulty;
  label: string;
  /** Probability of spawning a 4 when not using hostile value pick. */
  fourChance: number;
  hostileCell: boolean;
  hostileValue: boolean;
  timed: boolean;
  /** Seed board with scattered arbitrary power-of-two tiles. */
  randomStart: boolean;
};

export const DIFFICULTIES: Difficulty[] = [
  "normal",
  "hard",
  "hardest",
  "random",
];

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: "normal",
    label: "Normal",
    fourChance: 0.1,
    hostileCell: false,
    hostileValue: false,
    timed: false,
    randomStart: false,
  },
  hard: {
    id: "hard",
    label: "Hard",
    fourChance: 0.25,
    hostileCell: true,
    hostileValue: false,
    timed: false,
    randomStart: false,
  },
  hardest: {
    id: "hardest",
    label: "Hardest",
    fourChance: 0.4,
    hostileCell: true,
    hostileValue: true,
    timed: true,
    randomStart: false,
  },
  random: {
    id: "random",
    label: "Random",
    // After the chaotic seed, ongoing spawns match classic Normal.
    fourChance: 0.1,
    hostileCell: false,
    hostileValue: false,
    timed: false,
    randomStart: true,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return (
    value === "normal" ||
    value === "hard" ||
    value === "hardest" ||
    value === "random"
  );
}
