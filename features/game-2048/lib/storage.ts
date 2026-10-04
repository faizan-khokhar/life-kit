import { SIZE, type Board } from "@/features/game-2048/lib/game";

const BEST_SCORE_KEY = "life-kit:2048:best";
const GAME_STATE_KEY = "life-kit:2048:state";

export type SavedSnapshot = {
  board: Board;
  score: number;
};

export type SavedGameState = {
  board: Board;
  score: number;
  over: boolean;
  /** Board/score from before the last successful move; null after undo or at start. */
  previous: SavedSnapshot | null;
};

export function readBestScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(score: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      BEST_SCORE_KEY,
      String(Math.max(0, Math.floor(score)))
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function isValidBoard(value: unknown): value is Board {
  if (!Array.isArray(value) || value.length !== SIZE) return false;
  return value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === SIZE &&
      row.every(
        (cell) =>
          typeof cell === "number" &&
          Number.isInteger(cell) &&
          (cell === 0 || isPowerOfTwo(cell))
      )
  );
}

function isValidSnapshot(value: unknown): value is SavedSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    isValidBoard(candidate.board) &&
    typeof candidate.score === "number" &&
    Number.isFinite(candidate.score) &&
    candidate.score >= 0
  );
}

function isValidSavedGameState(value: unknown): value is SavedGameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (
    !isValidBoard(candidate.board) ||
    typeof candidate.score !== "number" ||
    !Number.isFinite(candidate.score) ||
    candidate.score < 0 ||
    typeof candidate.over !== "boolean"
  ) {
    return false;
  }
  if (candidate.previous === null) return true;
  return isValidSnapshot(candidate.previous);
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function cloneSnapshot(snapshot: SavedSnapshot): SavedSnapshot {
  return {
    board: cloneBoard(snapshot.board),
    score: Math.floor(snapshot.score),
  };
}

export function readGameState(): SavedGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSavedGameState(parsed)) {
      window.localStorage.removeItem(GAME_STATE_KEY);
      return null;
    }
    return {
      board: cloneBoard(parsed.board),
      score: Math.floor(parsed.score),
      over: parsed.over,
      previous: parsed.previous ? cloneSnapshot(parsed.previous) : null,
    };
  } catch {
    return null;
  }
}

export function writeGameState(state: SavedGameState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SavedGameState = {
      board: cloneBoard(state.board),
      score: Math.max(0, Math.floor(state.score)),
      over: state.over,
      previous: state.previous ? cloneSnapshot(state.previous) : null,
    };
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearGameState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GAME_STATE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
