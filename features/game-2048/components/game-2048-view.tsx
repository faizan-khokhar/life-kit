"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Pause, Play, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
  HARDEST_MOVE_TIME_MS,
  type Difficulty,
} from "@/features/game-2048/lib/difficulty";
import {
  boardToTiles,
  createInitialTiles,
  isGameOver,
  moveTiles,
  spawnTile,
  tilesToBoard,
  type Direction,
  type Tile,
} from "@/features/game-2048/lib/game";
import {
  readBestScore,
  readGameState,
  writeBestScore,
  writeGameState,
  type SavedSnapshot,
} from "@/features/game-2048/lib/storage";

const SWIPE_THRESHOLD = 24;
const MOVE_LOCK_MS = 150;
const TILE_GAP = "0.5rem";
const TIMER_URGENCY_MS = 5_000;

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

function tileClass(value: number): string {
  switch (value) {
    case 2:
      return "bg-[#eee4da] text-[#776e65]";
    case 4:
      return "bg-[#ede0c8] text-[#776e65]";
    case 8:
      return "bg-[#f2b179] text-white";
    case 16:
      return "bg-[#f59563] text-white";
    case 32:
      return "bg-[#f67c5f] text-white";
    case 64:
      return "bg-[#f65e3b] text-white";
    case 128:
      return "bg-[#edcf72] text-white";
    case 256:
      return "bg-[#edcc61] text-white";
    case 512:
      return "bg-[#edc850] text-white";
    case 1024:
      return "bg-[#edc53f] text-white";
    case 2048:
      return "bg-[#edc22e] text-white";
    default:
      return "bg-[#3c3a32] text-white";
  }
}

function tileTextSize(value: number): string {
  if (value >= 10000) return "text-base sm:text-lg";
  if (value >= 1000) return "text-lg sm:text-xl";
  if (value >= 100) return "text-xl sm:text-2xl";
  return "text-2xl sm:text-3xl";
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type TouchPoint = { x: number; y: number };

type PlayState = {
  tiles: Tile[];
  score: number;
  best: number;
  over: boolean;
  difficulty: Difficulty;
  /** Snapshot from before the last successful move. Cleared after undo. */
  previous: SavedSnapshot | null;
};

function hasProgress(state: PlayState): boolean {
  return state.previous !== null || state.score > 0 || state.over;
}

function applyDirection(state: PlayState, direction: Direction): PlayState {
  if (state.over) return state;

  const result = moveTiles(state.tiles, direction);
  if (!result.moved) return state;

  const nextTiles = spawnTile(result.tiles, state.difficulty);
  const nextScore = state.score + result.scoreGained;
  const nextBest = Math.max(state.best, nextScore);
  const nextBoard = tilesToBoard(nextTiles);

  if (nextBest > state.best) {
    writeBestScore(nextBest, state.difficulty);
  }

  return {
    ...state,
    tiles: nextTiles,
    score: nextScore,
    best: nextBest,
    over: isGameOver(nextBoard),
    previous: {
      board: tilesToBoard(state.tiles),
      score: state.score,
    },
  };
}

function undoLastMove(state: PlayState): PlayState {
  if (!state.previous) return state;
  return {
    ...state,
    tiles: boardToTiles(state.previous.board),
    score: state.previous.score,
    over: false,
    previous: null,
  };
}

function createFreshPlayState(
  best: number,
  difficulty: Difficulty
): PlayState {
  return {
    tiles: createInitialTiles(difficulty),
    score: 0,
    best,
    over: false,
    difficulty,
    previous: null,
  };
}

function applyTimeoutPenalty(state: PlayState): PlayState {
  if (state.difficulty !== "hardest" || state.over) return state;

  const nextTiles = spawnTile(state.tiles, "hardest");
  return {
    ...state,
    tiles: nextTiles,
    over: isGameOver(tilesToBoard(nextTiles)),
  };
}

export function Game2048View() {
  const [state, setState] = useState<PlayState | null>(null);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
    null
  );
  const [paused, setPaused] = useState(false);
  const [msLeft, setMsLeft] = useState(HARDEST_MOVE_TIME_MS);

  const stateRef = useRef<PlayState | null>(null);
  const pausedRef = useRef(false);
  const deadlineRef = useRef(Date.now() + HARDEST_MOVE_TIME_MS);
  const frozenRemainingRef = useRef(HARDEST_MOVE_TIME_MS);
  const touchStart = useRef<TouchPoint | null>(null);
  const moveLockedUntil = useRef(0);

  stateRef.current = state;
  pausedRef.current = paused;

  function armTimer(ms: number = HARDEST_MOVE_TIME_MS) {
    const remaining = Math.max(0, Math.min(HARDEST_MOVE_TIME_MS, ms));
    deadlineRef.current = Date.now() + remaining;
    frozenRemainingRef.current = remaining;
    setMsLeft(remaining);
  }

  function resetTimer() {
    armTimer(HARDEST_MOVE_TIME_MS);
  }

  useEffect(() => {
    const saved = readGameState();
    const difficulty = saved?.difficulty ?? "normal";
    const best = readBestScore(difficulty);

    if (saved) {
      const next: PlayState = {
        tiles: boardToTiles(saved.board),
        score: saved.score,
        best: Math.max(best, saved.score),
        over: saved.over,
        difficulty: saved.difficulty,
        previous: saved.previous,
      };
      setState(next);
      const shouldPause =
        saved.difficulty === "hardest" && Boolean(saved.paused) && !saved.over;
      setPaused(shouldPause);
      armTimer(HARDEST_MOVE_TIME_MS);
      return;
    }

    setState(createFreshPlayState(best, "normal"));
    setPaused(false);
    resetTimer();
  }, []);

  useEffect(() => {
    if (!state) return;
    writeGameState({
      board: tilesToBoard(state.tiles),
      score: state.score,
      over: state.over,
      difficulty: state.difficulty,
      paused: state.difficulty === "hardest" ? paused : false,
      previous: state.previous,
    });
  }, [state, paused]);

  // Hardest countdown — deadline ref is the source of truth so moves can reset it sync.
  useEffect(() => {
    if (!state || state.difficulty !== "hardest" || state.over || paused) {
      return;
    }

    const id = window.setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setMsLeft(left);

      if (left <= 0) {
        const prev = stateRef.current;
        if (prev && prev.difficulty === "hardest" && !prev.over) {
          const next = applyTimeoutPenalty(prev);
          stateRef.current = next;
          setState(next);
        }
        armTimer(HARDEST_MOVE_TIME_MS);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [state?.difficulty, state?.over, paused]);

  function requestDifficultyChange(next: Difficulty) {
    if (!state || next === state.difficulty) return;

    if (!hasProgress(state)) {
      const best = readBestScore(next);
      setState(createFreshPlayState(best, next));
      setPaused(false);
      resetTimer();
      return;
    }

    setPendingDifficulty(next);
  }

  function confirmDifficultyChange() {
    if (!pendingDifficulty) return;
    const best = readBestScore(pendingDifficulty);
    setState(createFreshPlayState(best, pendingDifficulty));
    setPendingDifficulty(null);
    setPaused(false);
    resetTimer();
  }

  function commitState(next: PlayState) {
    stateRef.current = next;
    setState(next);
  }

  function handleUndo() {
    if (pausedRef.current) return;
    const prev = stateRef.current;
    if (!prev) return;
    const next = undoLastMove(prev);
    if (next === prev) return;
    commitState(next);
    resetTimer();
  }

  function startNewRun() {
    const prev = stateRef.current;
    if (!prev?.over) return;
    commitState(createFreshPlayState(prev.best, prev.difficulty));
    setPaused(false);
    resetTimer();
  }

  function applyMove(direction: Direction) {
    if (pausedRef.current) return;
    if (Date.now() < moveLockedUntil.current) return;

    const prev = stateRef.current;
    if (!prev) return;

    const next = applyDirection(prev, direction);
    if (next === prev) return;

    moveLockedUntil.current = Date.now() + MOVE_LOCK_MS;
    commitState(next);
    resetTimer();
  }

  function pauseGame() {
    const current = stateRef.current;
    if (!current || current.difficulty !== "hardest" || current.over) return;
    if (pausedRef.current) return;

    frozenRemainingRef.current = Math.max(0, deadlineRef.current - Date.now());
    setMsLeft(frozenRemainingRef.current);
    setPaused(true);
  }

  function resumeGame() {
    const current = stateRef.current;
    if (!current || current.difficulty !== "hardest" || current.over) return;
    if (!pausedRef.current) return;

    armTimer(frozenRemainingRef.current || HARDEST_MOVE_TIME_MS);
    setPaused(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      applyMove(direction);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onTouchStart(event: TouchEvent) {
    if (pausedRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
    if (pausedRef.current) return;
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

    if (absX > absY) {
      applyMove(dx > 0 ? "right" : "left");
    } else {
      applyMove(dy > 0 ? "down" : "up");
    }
  }

  if (!state) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <header>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            2048
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading game…</p>
        </header>
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const { tiles, score, best, over, previous, difficulty } = state;
  const canUndo = previous !== null && !paused;
  const isHardest = difficulty === "hardest";
  const showTimer = isHardest && !over;
  const timerUrgent = showTimer && !paused && msLeft <= TIMER_URGENCY_MS;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            2048
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Swipe or use arrow keys. Undo one move.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            canUndo
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
          aria-label={canUndo ? "Undo last move" : "No move to undo"}
          title={canUndo ? "Undo last move" : "No move to undo"}
        >
          <Undo2 className="size-3.5" />
          Undo
        </button>
      </header>

      <div
        className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1"
        role="group"
        aria-label="Difficulty"
      >
        {DIFFICULTIES.map((level) => {
          const active = difficulty === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => requestDifficultyChange(level)}
              className={cn(
                "rounded-xl px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={active}
            >
              {DIFFICULTY_CONFIG[level].label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ScoreCard label="Score" value={score} />
        <ScoreCard label="Best" value={best} />
      </div>

      {showTimer ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 ring-1",
            timerUrgent
              ? "bg-destructive/10 text-destructive ring-destructive/30"
              : "bg-card text-foreground ring-foreground/10"
          )}
          aria-live="polite"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide uppercase">
              {paused ? "Paused" : "Move timer"}
            </p>
            <p className="font-heading text-xl font-semibold tabular-nums">
              {formatCountdown(msLeft)}
            </p>
          </div>
          <button
            type="button"
            onClick={paused ? resumeGame : pauseGame}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={paused ? "Resume game" : "Pause game"}
          >
            {paused ? (
              <>
                <Play className="size-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="size-3.5" />
                Pause
              </>
            )}
          </button>
        </div>
      ) : null}

      <div
        className="relative overflow-hidden rounded-3xl bg-card p-3 ring-1 ring-foreground/10"
        role="application"
        aria-label="2048 game board"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div className="relative aspect-square rounded-2xl bg-[#bbada0] p-2">
          <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-2">
            {Array.from({ length: 16 }, (_, index) => (
              <div
                key={index}
                className="rounded-xl bg-[#cdc1b4]/80"
                aria-hidden
              />
            ))}
          </div>

          {!paused ? (
            <div className="pointer-events-none absolute inset-2">
              {tiles.map((tile) => (
                <div
                  key={tile.id}
                  className={cn(
                    "game-2048-tile absolute top-0 left-0",
                    tile.isNew && "game-2048-tile-new",
                    tile.isMerged && "game-2048-tile-merged"
                  )}
                  style={{
                    width: `calc((100% - 3 * ${TILE_GAP}) / 4)`,
                    height: `calc((100% - 3 * ${TILE_GAP}) / 4)`,
                    transform: `translate(calc(${tile.col} * (100% + ${TILE_GAP})), calc(${tile.row} * (100% + ${TILE_GAP})))`,
                    zIndex: tile.isMerged ? 3 : tile.isNew ? 2 : 1,
                  }}
                >
                  <span
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-xl font-heading font-bold tabular-nums select-none",
                      tileClass(tile.value),
                      tileTextSize(tile.value)
                    )}
                  >
                    {tile.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <span className="sr-only">
          {DIFFICULTY_CONFIG[difficulty].label} mode. Board score {score}.
          {paused
            ? " Game paused."
            : ` ${tiles
                .map(
                  (tile) =>
                    `${tile.value} at row ${tile.row + 1} column ${tile.col + 1}`
                )
                .join(". ")}`}
        </span>

        {paused && !over ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl bg-background px-6">
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Paused
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Board hidden. Timer is frozen until you resume.
            </p>
            <button
              type="button"
              onClick={resumeGame}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <Play className="size-3.5" />
              Resume
            </button>
          </div>
        ) : null}

        {over ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl bg-background/80 backdrop-blur-[2px]">
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Game Over
            </p>
            <p className="text-sm text-muted-foreground">Score {score}</p>
            <div className="flex items-center gap-2">
              {previous !== null ? (
                <button
                  type="button"
                  onClick={handleUndo}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground",
                    "hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <Undo2 className="size-3.5" />
                  Undo
                </button>
              ) : null}
              <button
                type="button"
                onClick={startNewRun}
                className={cn(
                  "rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
                  "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={pendingDifficulty !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDifficulty(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch difficulty?</DialogTitle>
            <DialogDescription>
              Switching to{" "}
              {pendingDifficulty
                ? DIFFICULTY_CONFIG[pendingDifficulty].label
                : "another level"}{" "}
              will reset your current game. Best scores for each level are kept
              separately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDifficulty(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmDifficultyChange}>
              Reset & switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-heading text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
