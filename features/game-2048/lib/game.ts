export const SIZE = 4;

export type Board = number[][];
export type Direction = "up" | "down" | "left" | "right";

export type MoveResult = {
  board: Board;
  scoreGained: number;
  moved: boolean;
};

export type GameState = {
  board: Board;
  score: number;
};

export function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
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

export function spawnRandomTile(board: Board): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;

  const next = cloneBoard(board);
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
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

export function createInitialState(): GameState {
  let board = createEmptyBoard();
  board = spawnRandomTile(board);
  board = spawnRandomTile(board);
  return { board, score: 0 };
}
