"use client";

import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react";

const MANAGE_HREF = "/budget/manage" as Route;
import {
  deriveBudgetSummary,
  deriveCategorySpend,
  deriveRecentExpenses,
  deriveSpendingByDay,
} from "@/lib/data/budget";
import { addExpense } from "@/lib/data/expenses";
import {
  filterEntriesForMonth,
  formatMonthLabel,
  isSameMonth,
  shiftMonth,
  startOfMonth,
} from "@/lib/data/month";
import { useBudgetData } from "@/lib/data/use-budget-data";
import type { BudgetCategory } from "@/lib/data/types";
import { BudgetSummary } from "@/components/budget/budget-summary";
import { CategoryList } from "@/components/budget/category-list";
import { ExpenseList } from "@/components/budget/expense-list";
import { QuickSpendSheet } from "@/components/budget/quick-spend-sheet";
import { SpendingChart } from "@/components/budget/spending-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPKR } from "@/lib/format";

export function BudgetView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    uid,
    categories,
    entries,
    setEntries,
    loading,
    error,
    reload,
  } = useBudgetData();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [spendCategory, setSpendCategory] = useState<BudgetCategory | null>(
    null,
  );
  const spendAction = searchParams.get("action") === "spend";
  const [manualPick, setManualPick] = useState(false);
  const pickOpen = spendAction || manualPick;
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeTitle, setIncomeTitle] = useState("Income");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSaving, setIncomeSaving] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);

  function setPickOpen(open: boolean) {
    if (open) {
      setManualPick(true);
      return;
    }
    setManualPick(false);
    if (spendAction) {
      router.replace("/budget", { scroll: false });
    }
  }

  const monthEntries = useMemo(
    () => filterEntriesForMonth(entries, month),
    [entries, month],
  );

  const monthLabel = formatMonthLabel(month);
  const summary = useMemo(
    () => deriveBudgetSummary(monthEntries, monthLabel),
    [monthEntries, monthLabel],
  );
  const days = useMemo(
    () => deriveSpendingByDay(monthEntries, month),
    [monthEntries, month],
  );
  const categorySpend = useMemo(
    () => deriveCategorySpend(categories, monthEntries),
    [categories, monthEntries],
  );
  const recent = useMemo(
    () => deriveRecentExpenses(monthEntries),
    [monthEntries],
  );

  const spendMonthSpent = useMemo(() => {
    if (!spendCategory) return 0;
    const row = categorySpend.find((c) => c.id === spendCategory.id);
    return row?.spent ?? 0;
  }, [spendCategory, categorySpend]);

  const occurredAtForSave = useMemo(() => {
    if (isSameMonth(month, new Date())) return new Date();
    // Mid-month stamp when logging while browsing a past month
    return new Date(month.getFullYear(), month.getMonth(), 15, 12, 0, 0, 0);
  }, [month]);

  function openCategory(categoryId: string) {
    const cat = categories.find((c) => c.id === categoryId) ?? null;
    setSpendCategory(cat);
    setPickOpen(false);
  }

  async function handleAddIncome(event: FormEvent) {
    event.preventDefault();
    if (!uid) return;
    setIncomeError(null);
    const amount = Number(incomeAmount);
    if (!incomeTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setIncomeError("Enter a title and a positive amount.");
      return;
    }
    setIncomeSaving(true);
    try {
      const created = await addExpense(uid, {
        title: incomeTitle.trim(),
        category: "Income",
        amount,
        type: "income",
        occurredAt: occurredAtForSave,
      });
      setEntries((prev) => [created, ...prev]);
      setIncomeAmount("");
      setIncomeTitle("Income");
      setIncomeOpen(false);
    } catch (err) {
      setIncomeError(
        err instanceof Error ? err.message : "Could not save income.",
      );
    } finally {
      setIncomeSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-28 text-center text-sm font-medium">{monthLabel}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            disabled={isSameMonth(month, new Date())}
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog
            open={incomeOpen}
            onOpenChange={(open) => {
              setIncomeOpen(open);
              setIncomeError(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-4" aria-hidden />
                Add income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add income</DialogTitle>
                  <DialogDescription>
                    Log money coming in for {monthLabel.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
                {incomeError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{incomeError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="income-title">Title</Label>
                  <Input
                    id="income-title"
                    value={incomeTitle}
                    onChange={(e) => setIncomeTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Amount (Rs)</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    min={1}
                    step={1}
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={incomeSaving}>
                    {incomeSaving ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={MANAGE_HREF}>
              <Settings2 className="size-4" aria-hidden />
              Manage
            </Link>
          </Button>
        </div>
      </div>

      <BudgetSummary summary={summary} />
      <SpendingChart days={days} />
      <CategoryList
        categories={categorySpend}
        onSelectCategory={openCategory}
      />
      <ExpenseList expenses={recent} />

      <Sheet open={pickOpen} onOpenChange={setPickOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>Add expense</SheetTitle>
            <SheetDescription>Pick a category, then an amount.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 px-4 pb-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet.{" "}
                <Link href={MANAGE_HREF} className="underline">
                  Create one
                </Link>
              </p>
            ) : (
              categories.map((cat) => {
                const spend =
                  categorySpend.find((c) => c.id === cat.id)?.spent ?? 0;
                return (
                  <Button
                    key={cat.id}
                    variant="outline"
                    className="h-auto justify-between rounded-2xl px-4 py-3.5"
                    onClick={() => openCategory(cat.id)}
                  >
                    <span className="font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatPKR(spend)} / {formatPKR(cat.limit)}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {uid ? (
        <QuickSpendSheet
          open={spendCategory != null}
          onOpenChange={(open) => {
            if (!open) setSpendCategory(null);
          }}
          category={spendCategory}
          monthSpent={spendMonthSpent}
          entries={entries}
          uid={uid}
          occurredAt={occurredAtForSave}
          onSaved={(created) => {
            setEntries((prev) => [created, ...prev]);
          }}
        />
      ) : null}
    </div>
  );
}
