"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  cloneBoard,
  createInitialState,
  isGameOver,
  move,
  spawnRandomTile,
  type Board,
  type Direction,
} from "@/features/game-2048/lib/game";
import {
  readBestScore,
  readGameState,
  writeBestScore,
  writeGameState,
  type SavedSnapshot,
} from "@/features/game-2048/lib/storage";

const SWIPE_THRESHOLD = 24;

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
    case 0:
      return "bg-muted/60 text-transparent";
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

type TouchPoint = { x: number; y: number };

type PlayState = {
  board: Board;
  score: number;
  best: number;
  over: boolean;
  /** Snapshot from before the last successful move. Cleared after undo. */
  previous: SavedSnapshot | null;
};

function applyDirection(state: PlayState, direction: Direction): PlayState {
  if (state.over) return state;

  const result = move(state.board, direction);
  if (!result.moved) return state;

  const nextBoard = spawnRandomTile(result.board);
  const nextScore = state.score + result.scoreGained;
  const nextBest = Math.max(state.best, nextScore);

  if (nextBest > state.best) {
    writeBestScore(nextBest);
  }

  return {
    board: nextBoard,
    score: nextScore,
    best: nextBest,
    over: isGameOver(nextBoard),
    previous: {
      board: cloneBoard(state.board),
      score: state.score,
    },
  };
}

function undoLastMove(state: PlayState): PlayState {
  if (!state.previous) return state;
  return {
    board: cloneBoard(state.previous.board),
    score: state.previous.score,
    best: state.best,
    over: false,
    previous: null,
  };
}

function createFreshPlayState(best: number): PlayState {
  const initial = createInitialState();
  return {
    board: initial.board,
    score: 0,
    best,
    over: false,
    previous: null,
  };
}

export function Game2048View() {
  const [state, setState] = useState<PlayState | null>(null);
  const touchStart = useRef<TouchPoint | null>(null);

  useEffect(() => {
    const best = readBestScore();
    const saved = readGameState();

    if (saved) {
      setState({
        board: saved.board,
        score: saved.score,
        best: Math.max(best, saved.score),
        over: saved.over,
        previous: saved.previous,
      });
      return;
    }

    setState(createFreshPlayState(best));
  }, []);

  useEffect(() => {
    if (!state) return;
    writeGameState({
      board: state.board,
      score: state.score,
      over: state.over,
      previous: state.previous,
    });
  }, [state]);

  function handleUndo() {
    setState((prev) => (prev ? undoLastMove(prev) : prev));
  }

  function startNewRun() {
    setState((prev) => {
      if (!prev?.over) return prev;
      return createFreshPlayState(prev.best);
    });
  }

  function applyMove(direction: Direction) {
    setState((prev) => (prev ? applyDirection(prev, direction) : prev));
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
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
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

  const { board, score, best, over, previous } = state;
  const canUndo = previous !== null;

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

      <div className="grid grid-cols-2 gap-2">
        <ScoreCard label="Score" value={score} />
        <ScoreCard label="Best" value={best} />
      </div>

      <div
        className="relative overflow-hidden rounded-3xl bg-card p-3 ring-1 ring-foreground/10"
        role="application"
        aria-label="2048 game board"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div className="grid aspect-square grid-cols-4 grid-rows-4 gap-2 rounded-2xl bg-[#bbada0] p-2">
          {board.flatMap((row, r) =>
            row.map((value, c) => (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-xl font-heading font-bold tabular-nums select-none",
                  "transition-colors duration-150",
                  tileClass(value),
                  value > 0 && tileTextSize(value)
                )}
                aria-label={value === 0 ? "Empty cell" : `Tile ${value}`}
              >
                {value || ""}
              </div>
            ))
          )}
        </div>

        {over ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-background/80 backdrop-blur-[2px]">
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Game Over
            </p>
            <p className="text-sm text-muted-foreground">Score {score}</p>
            <div className="flex items-center gap-2">
              {canUndo ? (
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
