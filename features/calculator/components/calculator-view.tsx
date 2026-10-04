"use client";

import { type Dispatch, type ReactNode, useReducer } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

type Op = "+" | "-" | "×" | "÷";

type CalcState = {
  display: string;
  expression: string;
  accumulator: number | null;
  pendingOp: Op | null;
  overwrite: boolean;
  error: boolean;
};

type CalcAction =
  | { type: "DIGIT"; digit: string }
  | { type: "DECIMAL" }
  | { type: "OP"; op: Op }
  | { type: "EQUALS" }
  | { type: "PERCENT" }
  | { type: "BACKSPACE" }
  | { type: "CLEAR_ENTRY" }
  | { type: "ALL_CLEAR" };

const INITIAL: CalcState = {
  display: "0",
  expression: "",
  accumulator: null,
  pendingOp: null,
  overwrite: true,
  error: false,
};

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const rounded = Number(n.toPrecision(12));
  const str = String(rounded);
  if (str.length <= 14) return str;
  return rounded.toExponential(6);
}

function applyOp(a: number, op: Op, b: number): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? null : a / b;
  }
}

function parseDisplay(display: string): number {
  return Number(display);
}

function digitCount(display: string): number {
  return display.replace("-", "").replace(".", "").length;
}

function reducer(state: CalcState, action: CalcAction): CalcState {
  if (state.error && action.type !== "ALL_CLEAR" && action.type !== "CLEAR_ENTRY") {
    return state;
  }

  switch (action.type) {
    case "ALL_CLEAR":
      return INITIAL;

    case "CLEAR_ENTRY":
      if (state.error) return INITIAL;
      return { ...state, display: "0", overwrite: true };

    case "DIGIT": {
      if (state.overwrite) {
        return {
          ...state,
          display: action.digit,
          overwrite: false,
          error: false,
        };
      }
      if (digitCount(state.display) >= 12) return state;
      if (state.display === "0") {
        return { ...state, display: action.digit };
      }
      if (state.display === "-0") {
        return { ...state, display: `-${action.digit}` };
      }
      return { ...state, display: state.display + action.digit };
    }

    case "DECIMAL": {
      if (state.overwrite) {
        return { ...state, display: "0.", overwrite: false, error: false };
      }
      if (state.display.includes(".")) return state;
      return { ...state, display: `${state.display}.` };
    }

    case "BACKSPACE": {
      if (state.overwrite || state.display === "0") return state;
      if (state.display.length <= 1 || state.display === "-") {
        return { ...state, display: "0", overwrite: true };
      }
      return { ...state, display: state.display.slice(0, -1) };
    }

    case "PERCENT": {
      const value = parseDisplay(state.display);
      if (!Number.isFinite(value)) {
        return {
          ...INITIAL,
          display: "Error",
          error: true,
        };
      }
      return {
        ...state,
        display: formatNumber(value / 100),
        overwrite: true,
      };
    }

    case "OP": {
      const current = parseDisplay(state.display);

      if (state.accumulator !== null && state.pendingOp && !state.overwrite) {
        const result = applyOp(state.accumulator, state.pendingOp, current);
        if (result === null) {
          return {
            ...INITIAL,
            display: "Error",
            expression: `${formatNumber(state.accumulator)} ${state.pendingOp} ${state.display}`,
            error: true,
          };
        }
        return {
          display: formatNumber(result),
          expression: `${formatNumber(result)} ${action.op}`,
          accumulator: result,
          pendingOp: action.op,
          overwrite: true,
          error: false,
        };
      }

      if (state.overwrite && state.pendingOp && state.accumulator !== null) {
        return {
          ...state,
          pendingOp: action.op,
          expression: `${formatNumber(state.accumulator)} ${action.op}`,
        };
      }

      const left =
        state.overwrite && state.accumulator !== null
          ? state.accumulator
          : current;

      return {
        ...state,
        accumulator: left,
        pendingOp: action.op,
        expression: `${formatNumber(left)} ${action.op}`,
        overwrite: true,
        error: false,
      };
    }

    case "EQUALS": {
      if (state.pendingOp === null || state.accumulator === null) {
        return {
          ...state,
          expression: state.display,
          overwrite: true,
        };
      }

      const current = parseDisplay(state.display);
      const expr = `${formatNumber(state.accumulator)} ${state.pendingOp} ${state.display}`;
      const result = applyOp(state.accumulator, state.pendingOp, current);

      if (result === null) {
        return {
          ...INITIAL,
          display: "Error",
          expression: expr,
          error: true,
        };
      }

      return {
        display: formatNumber(result),
        expression: `${expr} =`,
        accumulator: result,
        pendingOp: null,
        overwrite: true,
        error: false,
      };
    }

    default:
      return state;
  }
}

type KeyVariant = "number" | "fn" | "op" | "equals";

type KeyDef = {
  id: string;
  label: ReactNode;
  ariaLabel: string;
  variant: KeyVariant;
  span?: 1 | 2;
  onPress: (dispatch: Dispatch<CalcAction>) => void;
};

const KEYS: KeyDef[] = [
  {
    id: "clear",
    label: "AC",
    ariaLabel: "Clear",
    variant: "fn",
    onPress: () => undefined,
  },
  {
    id: "back",
    label: <Delete className="size-5" aria-hidden />,
    ariaLabel: "Backspace",
    variant: "fn",
    onPress: (d) => d({ type: "BACKSPACE" }),
  },
  {
    id: "pct",
    label: "%",
    ariaLabel: "Percent",
    variant: "fn",
    onPress: (d) => d({ type: "PERCENT" }),
  },
  {
    id: "div",
    label: "÷",
    ariaLabel: "Divide",
    variant: "op",
    onPress: (d) => d({ type: "OP", op: "÷" }),
  },
  {
    id: "7",
    label: "7",
    ariaLabel: "7",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "7" }),
  },
  {
    id: "8",
    label: "8",
    ariaLabel: "8",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "8" }),
  },
  {
    id: "9",
    label: "9",
    ariaLabel: "9",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "9" }),
  },
  {
    id: "mul",
    label: "×",
    ariaLabel: "Multiply",
    variant: "op",
    onPress: (d) => d({ type: "OP", op: "×" }),
  },
  {
    id: "4",
    label: "4",
    ariaLabel: "4",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "4" }),
  },
  {
    id: "5",
    label: "5",
    ariaLabel: "5",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "5" }),
  },
  {
    id: "6",
    label: "6",
    ariaLabel: "6",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "6" }),
  },
  {
    id: "sub",
    label: "−",
    ariaLabel: "Subtract",
    variant: "op",
    onPress: (d) => d({ type: "OP", op: "-" }),
  },
  {
    id: "1",
    label: "1",
    ariaLabel: "1",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "1" }),
  },
  {
    id: "2",
    label: "2",
    ariaLabel: "2",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "2" }),
  },
  {
    id: "3",
    label: "3",
    ariaLabel: "3",
    variant: "number",
    onPress: (d) => d({ type: "DIGIT", digit: "3" }),
  },
  {
    id: "add",
    label: "+",
    ariaLabel: "Add",
    variant: "op",
    onPress: (d) => d({ type: "OP", op: "+" }),
  },
  {
    id: "0",
    label: "0",
    ariaLabel: "0",
    variant: "number",
    span: 2,
    onPress: (d) => d({ type: "DIGIT", digit: "0" }),
  },
  {
    id: "dot",
    label: ".",
    ariaLabel: "Decimal",
    variant: "number",
    onPress: (d) => d({ type: "DECIMAL" }),
  },
  {
    id: "eq",
    label: "=",
    ariaLabel: "Equals",
    variant: "equals",
    onPress: (d) => d({ type: "EQUALS" }),
  },
];

function keyClass(variant: KeyVariant) {
  switch (variant) {
    case "number":
      return "bg-muted text-foreground hover:bg-muted/80 active:scale-[0.97]";
    case "fn":
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97]";
    case "op":
      return "bg-primary/15 text-primary hover:bg-primary/25 active:scale-[0.97]";
    case "equals":
      return "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]";
  }
}

function hasEntryToClear(state: CalcState): boolean {
  return (
    state.error ||
    (!state.overwrite && state.display !== "0") ||
    (state.overwrite && state.display !== "0" && state.pendingOp === null)
  );
}

export function CalculatorView() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const showClearEntry = hasEntryToClear(state);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Calculator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyday math, fully on-device.
        </p>
      </header>

      <div
        className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10"
        role="application"
        aria-label="Calculator"
      >
        <div className="flex flex-col items-end justify-end gap-1 px-5 pt-8 pb-4">
          <p
            className="min-h-6 w-full truncate text-right text-sm text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {state.expression || "\u00A0"}
          </p>
          <p
            className={cn(
              "w-full truncate text-right font-heading text-5xl font-semibold tracking-tight tabular-nums",
              state.error ? "text-destructive" : "text-foreground",
              state.display.length > 9 && "text-4xl",
              state.display.length > 12 && "text-3xl"
            )}
            aria-live="polite"
          >
            {state.display}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {KEYS.map((key) => {
            const isClear = key.id === "clear";
            const label = isClear ? (showClearEntry ? "C" : "AC") : key.label;
            const ariaLabel = isClear
              ? showClearEntry
                ? "Clear entry"
                : "All clear"
              : key.ariaLabel;

            return (
              <button
                key={key.id}
                type="button"
                aria-label={ariaLabel}
                onClick={() => {
                  if (isClear) {
                    dispatch({
                      type: showClearEntry ? "CLEAR_ENTRY" : "ALL_CLEAR",
                    });
                    return;
                  }
                  key.onPress(dispatch);
                }}
                className={cn(
                  "flex h-16 items-center justify-center rounded-2xl text-xl font-medium transition-transform select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  key.span === 2 && "col-span-2",
                  keyClass(key.variant)
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
