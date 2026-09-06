"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  getAmountPresets,
  lastExpenseAmountForCategory,
} from "@/features/budget/data/amount-presets";
import { addExpense } from "@/features/budget/data/expenses";
import type { BudgetCategory, MoneyEntry } from "@/features/budget/data/types";
import { formatPKR } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type QuickSpendSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BudgetCategory | null;
  monthSpent: number;
  entries: MoneyEntry[];
  uid: string;
  /** When saving into a past/future month view, stamp occurredAt in that month. */
  occurredAt?: Date;
  onSaved: (entry: MoneyEntry) => void;
};

export function QuickSpendSheet({
  open,
  onOpenChange,
  category,
  monthSpent,
  entries,
  uid,
  occurredAt,
  onSaved,
}: QuickSpendSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        {category ? (
          <QuickSpendForm
            key={category.id}
            category={category}
            monthSpent={monthSpent}
            entries={entries}
            uid={uid}
            occurredAt={occurredAt}
            onSaved={(entry) => {
              onSaved(entry);
              onOpenChange(false);
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function QuickSpendForm({
  category,
  monthSpent,
  entries,
  uid,
  occurredAt,
  onSaved,
}: {
  category: BudgetCategory;
  monthSpent: number;
  entries: MoneyEntry[];
  uid: string;
  occurredAt?: Date;
  onSaved: (entry: MoneyEntry) => void;
}) {
  const [customAmount, setCustomAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = category.limit - monthSpent;
  const isPaid =
    category.isFixed && category.limit > 0 && monthSpent >= category.limit;

  const lastAmount = useMemo(
    () => lastExpenseAmountForCategory(category.name, entries),
    [category.name, entries],
  );

  const presets = useMemo(
    () => getAmountPresets(category.name, lastAmount),
    [category.name, lastAmount],
  );

  async function saveAmount(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const when = occurredAt ?? new Date();
      const created = await addExpense(uid, {
        title: category.name,
        category: category.name,
        amount,
        type: "expense",
        occurredAt: when,
      });
      onSaved(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setSaving(false);
    }
  }

  function handleCustomSubmit(event: FormEvent) {
    event.preventDefault();
    void saveAmount(Number(customAmount));
  }

  const overspendWarning =
    customAmount !== "" &&
    Number(customAmount) > 0 &&
    Number(customAmount) > remaining;

  return (
    <>
      <SheetHeader className="pb-2">
        <SheetTitle>{category.name}</SheetTitle>
        <SheetDescription>
          {`${formatPKR(monthSpent)} spent Â· ${formatPKR(Math.max(remaining, 0))} left of ${formatPKR(category.limit)}`}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-2">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {category.isFixed ? (
          <Button
            className="h-12 w-full text-base"
            disabled={saving || isPaid}
            onClick={() => void saveAmount(category.limit)}
          >
            {isPaid
              ? "Already paid this month"
              : `Mark paid Â· ${formatPKR(category.limit)}`}
          </Button>
        ) : null}

        {!category.isFixed && remaining > 0 ? (
          <Button
            className="h-12 w-full text-base"
            disabled={saving}
            onClick={() => void saveAmount(remaining)}
          >
            Use remaining Â· {formatPKR(remaining)}
          </Button>
        ) : null}

        {!category.isFixed ? (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Quick amounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={saving}
                    onClick={() => void saveAmount(amount)}
                  >
                    {formatPKR(amount)}
                  </Button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="quick-custom-amount">Custom amount (Rs)</Label>
                <Input
                  id="quick-custom-amount"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 1500"
                />
              </div>
              {overspendWarning ? (
                <Alert>
                  <AlertDescription>
                    This is over your remaining{" "}
                    {formatPKR(Math.max(remaining, 0))}. You can still save it.
                  </AlertDescription>
                </Alert>
              ) : null}
              <SheetFooter className="p-0">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving || !customAmount}
                >
                  {saving ? "Savingâ€¦" : "Save amount"}
                </Button>
              </SheetFooter>
            </form>
          </>
        ) : null}
      </div>
    </>
  );
}
