import {
  DIFFICULTY_CONFIG,
  RANDOM_START_MAX_EXPONENT,
  type Difficulty,
} from "@/features/game-2048/lib/difficulty";

export const SIZE = 4;

export type Board = number[][];
export type Direction = "up" | "down" | "left" | "right";
export type { Difficulty };

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

export type MoveResult = {
  board: Board;
  scoreGained: number;
  moved: boolean;
};

export type TileMoveResult = {
  tiles: Tile[];
  scoreGained: number;
  moved: boolean;
};

export type GameState = {
  board: Board;
  score: number;
};

let nextTileId = 1;

function allocTileId(): number {
  return nextTileId++;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function tilesToBoard(tiles: Tile[]): Board {
  const board = createEmptyBoard();
  for (const tile of tiles) {
    board[tile.row][tile.col] = tile.value;
  }
  return board;
}

export function boardToTiles(board: Board): Tile[] {
  const tiles: Tile[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = board[row][col];
      if (value !== 0) {
        tiles.push({ id: allocTileId(), value, row, col });
      }
    }
  }
  return tiles;
}

function emptyCells(board: Board): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function neighbors(row: number, col: number): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  if (row > 0) result.push([row - 1, col]);
  if (row < SIZE - 1) result.push([row + 1, col]);
  if (col > 0) result.push([row, col - 1]);
  if (col < SIZE - 1) result.push([row, col + 1]);
  return result;
}

/** Occupied neighbors that cannot merge with `value` score higher (worse for player). */
function hostilityScore(
  board: Board,
  row: number,
  col: number,
  value: number
): number {
  let score = 0;
  for (const [nr, nc] of neighbors(row, col)) {
    const neighbor = board[nr][nc];
    if (neighbor === 0) continue;
    if (neighbor === value) score -= 2;
    else score += 1;
  }
  return score;
}

function pickWorstCell(board: Board): [number, number] | null {
  const cells = emptyCells(board);
  if (cells.length === 0) return null;

  let bestScore = -Infinity;
  const candidates: Array<[number, number]> = [];

  for (const [row, col] of cells) {
    let blockers = 0;
    for (const [nr, nc] of neighbors(row, col)) {
      if (board[nr][nc] !== 0) blockers += 1;
    }
    if (blockers > bestScore) {
      bestScore = blockers;
      candidates.length = 0;
      candidates.push([row, col]);
    } else if (blockers === bestScore) {
      candidates.push([row, col]);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickRandomCell(board: Board): [number, number] | null {
  const cells = emptyCells(board);
  if (cells.length === 0) return null;
  return cells[Math.floor(Math.random() * cells.length)];
}

function pickWorstValue(
  board: Board,
  row: number,
  col: number,
  fourChance: number
): 2 | 4 {
  const score2 = hostilityScore(board, row, col, 2);
  const score4 = hostilityScore(board, row, col, 4);
  if (score4 > score2) return 4;
  if (score2 > score4) return 2;
  return Math.random() < fourChance ? 4 : 2;
}

type SpawnChoice = { row: number; col: number; value: 2 | 4 };

function chooseSpawn(
  board: Board,
  difficulty: Difficulty
): SpawnChoice | null {
  const config = DIFFICULTY_CONFIG[difficulty];
  const cell = config.hostileCell
    ? pickWorstCell(board)
    : pickRandomCell(board);
  if (!cell) return null;

  const [row, col] = cell;
  const value = config.hostileValue
    ? pickWorstValue(board, row, col, config.fourChance)
    : Math.random() < config.fourChance
      ? 4
      : 2;

  return { row, col, value };
}

export function spawnRandomTile(
  board: Board,
  difficulty: Difficulty = "normal"
): Board {
  const choice = chooseSpawn(board, difficulty);
  if (!choice) return board;

  const next = cloneBoard(board);
  next[choice.row][choice.col] = choice.value;
  return next;
}

export function spawnTile(
  tiles: Tile[],
  difficulty: Difficulty = "normal"
): Tile[] {
  const choice = chooseSpawn(tilesToBoard(tiles), difficulty);
  if (!choice) return tiles;

  return [
    ...tiles,
    {
      id: allocTileId(),
      value: choice.value,
      row: choice.row,
      col: choice.col,
      isNew: true,
    },
  ];
}

/** Slide and merge one line toward the start (index 0). */
function slideLine(line: number[]): { line: number[]; scoreGained: number } {
  const tiles = line.filter((v) => v !== 0);
  const merged: number[] = [];
  let scoreGained = 0;
  let i = 0;

  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const value = tiles[i] * 2;
      merged.push(value);
      scoreGained += value;
      i += 2;
    } else {
      merged.push(tiles[i]);
      i += 1;
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { line: merged, scoreGained };
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/** Cell order for a line so index 0 is the destination edge. */
function linePositions(
  direction: Direction,
  line: number
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < SIZE; i++) {
    switch (direction) {
      case "left":
        positions.push({ row: line, col: i });
        break;
      case "right":
        positions.push({ row: line, col: SIZE - 1 - i });
        break;
      case "up":
        positions.push({ row: i, col: line });
        break;
      case "down":
        positions.push({ row: SIZE - 1 - i, col: line });
        break;
    }
  }
  return positions;
}

export function move(board: Board, direction: Direction): MoveResult {
  const next = cloneBoard(board);
  let scoreGained = 0;

  const processLine = (line: number[]) => {
    const result = slideLine(line);
    scoreGained += result.scoreGained;
    return result.line;
  };

  if (direction === "left") {
    for (let r = 0; r < SIZE; r++) {
      next[r] = processLine(next[r]);
    }
  } else if (direction === "right") {
    for (let r = 0; r < SIZE; r++) {
      next[r] = processLine([...next[r]].reverse()).reverse();
    }
  } else if (direction === "up") {
    for (let c = 0; c < SIZE; c++) {
      const col = next.map((row) => row[c]);
      const slid = processLine(col);
      for (let r = 0; r < SIZE; r++) next[r][c] = slid[r];
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      const col = next.map((row) => row[c]).reverse();
      const slid = processLine(col).reverse();
      for (let r = 0; r < SIZE; r++) next[r][c] = slid[r];
    }
  }

  const moved = !boardsEqual(board, next);
  return { board: next, scoreGained, moved };
}

/** Identity-preserving move for CSS slide animations. */
export function moveTiles(tiles: Tile[], direction: Direction): TileMoveResult {
  const byPos = new Map<string, Tile>();
  for (const tile of tiles) {
    byPos.set(`${tile.row},${tile.col}`, {
      ...tile,
      isNew: false,
      isMerged: false,
    });
  }

  let scoreGained = 0;
  const nextTiles: Tile[] = [];

  for (let line = 0; line < SIZE; line++) {
    const positions = linePositions(direction, line);
    const lineTiles = positions
      .map((pos) => byPos.get(`${pos.row},${pos.col}`))
      .filter((tile): tile is Tile => tile != null);

    const packed: Tile[] = [];
    let i = 0;
    while (i < lineTiles.length) {
      const current = lineTiles[i];
      const next = lineTiles[i + 1];
      if (next && current.value === next.value) {
        const value = current.value * 2;
        scoreGained += value;
        packed.push({
          id: current.id,
          value,
          row: current.row,
          col: current.col,
          isMerged: true,
        });
        i += 2;
      } else {
        packed.push({
          id: current.id,
          value: current.value,
          row: current.row,
          col: current.col,
        });
        i += 1;
      }
    }

    for (let slot = 0; slot < packed.length; slot++) {
      const pos = positions[slot];
      nextTiles.push({
        ...packed[slot],
        row: pos.row,
        col: pos.col,
      });
    }
  }

  const moved = !boardsEqual(tilesToBoard(tiles), tilesToBoard(nextTiles));
  return { tiles: nextTiles, scoreGained, moved };
}

export function isGameOver(board: Board): boolean {
  if (emptyCells(board).length > 0) return false;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (c + 1 < SIZE && board[r][c + 1] === value) return false;
      if (r + 1 < SIZE && board[r + 1][c] === value) return false;
    }
  }
  return true;
}

/** Power of two from 2^1 .. 2^RANDOM_START_MAX_EXPONENT (max 1024) — no sequence. */
function randomStartValue(): number {
  const exp = 1 + Math.floor(Math.random() * RANDOM_START_MAX_EXPONENT);
  return 2 ** exp;
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

/**
 * Scatter random power-of-two tiles across the board (not a full fill).
 * Retries until the position is still playable.
 */
export function createRandomStartBoard(): Board {
  const minTiles = 6;
  const maxTiles = 12;

  for (let attempt = 0; attempt < 40; attempt++) {
    const board = createEmptyBoard();
    const cells = shuffleInPlace(
      Array.from({ length: SIZE * SIZE }, (_, index) => ({
        row: Math.floor(index / SIZE),
        col: index % SIZE,
      }))
    );
    const count =
      minTiles + Math.floor(Math.random() * (maxTiles - minTiles + 1));

    for (let i = 0; i < count; i++) {
      const { row, col } = cells[i];
      board[row][col] = randomStartValue();
    }

    if (!isGameOver(board) && emptyCells(board).length > 0) {
      return board;
    }
  }

  // Extremely unlikely fallback: classic two-tile open.
  let board = createEmptyBoard();
  board = spawnRandomTile(board, "normal");
  board = spawnRandomTile(board, "normal");
  return board;
}

export function createInitialState(
  difficulty: Difficulty = "normal"
): GameState {
  if (DIFFICULTY_CONFIG[difficulty].randomStart) {
    return { board: createRandomStartBoard(), score: 0 };
  }

  let board = createEmptyBoard();
  board = spawnRandomTile(board, difficulty);
  board = spawnRandomTile(board, difficulty);
  return { board, score: 0 };
}

export function createInitialTiles(
  difficulty: Difficulty = "normal"
): Tile[] {
  return boardToTiles(createInitialState(difficulty).board);
}
