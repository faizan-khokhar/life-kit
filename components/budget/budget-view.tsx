"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  addBudgetCategory,
  deriveBudgetSummary,
  deriveCategorySpend,
  deriveRecentExpenses,
  deriveSpendingByDay,
  getBudgetCategories,
} from "@/lib/data/budget";
import { addExpense, getExpenses } from "@/lib/data/expenses";
import type {
  BudgetCategory,
  MoneyEntry,
  MoneyEntryType,
} from "@/lib/data/types";
import { BudgetSummary } from "@/components/budget/budget-summary";
import { CategoryList } from "@/components/budget/category-list";
import { ExpenseList } from "@/components/budget/expense-list";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetView() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entryOpen, setEntryOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [entryTitle, setEntryTitle] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryCategory, setEntryCategory] = useState("");
  const [entryType, setEntryType] = useState<MoneyEntryType>("expense");

  const [categoryName, setCategoryName] = useState("");
  const [categoryLimit, setCategoryLimit] = useState("");

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextEntries] = await Promise.all([
        getBudgetCategories(uid),
        getExpenses(uid),
      ]);
      setCategories(nextCategories);
      setEntries(nextEntries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load budget data.",
      );
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const [nextCategories, nextEntries] = await Promise.all([
          getBudgetCategories(uid!),
          getExpenses(uid!),
        ]);
        if (cancelled) return;
        setCategories(nextCategories);
        setEntries(nextEntries);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load budget data.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const summary = useMemo(
    () => deriveBudgetSummary(entries, "All time"),
    [entries],
  );
  const days = useMemo(() => deriveSpendingByDay(entries), [entries]);
  const categorySpend = useMemo(
    () => deriveCategorySpend(categories, entries),
    [categories, entries],
  );
  const recent = useMemo(() => deriveRecentExpenses(entries), [entries]);

  async function handleAddEntry(event: FormEvent) {
    event.preventDefault();
    if (!uid) return;
    setFormError(null);
    const amount = Number(entryAmount);
    if (!entryTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a title and a positive amount.");
      return;
    }
    if (!entryCategory.trim()) {
      setFormError("Enter or pick a category.");
      return;
    }

    setSaving(true);
    try {
      const created = await addExpense(uid, {
        title: entryTitle.trim(),
        category: entryCategory.trim(),
        amount,
        type: entryType,
        occurredAt: new Date(),
      });
      setEntries((prev) => [created, ...prev]);
      setEntryTitle("");
      setEntryAmount("");
      setEntryCategory("");
      setEntryType("expense");
      setEntryOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory(event: FormEvent) {
    event.preventDefault();
    if (!uid) return;
    setFormError(null);
    const limit = Number(categoryLimit);
    if (!categoryName.trim() || !Number.isFinite(limit) || limit < 0) {
      setFormError("Enter a name and a non-negative limit.");
      return;
    }

    setSaving(true);
    try {
      const created = await addBudgetCategory(uid, {
        name: categoryName.trim(),
        limit,
      });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCategoryName("");
      setCategoryLimit("");
      setCategoryOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save category.",
      );
    } finally {
      setSaving(false);
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
        <Button variant="outline" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog
          open={entryOpen}
          onOpenChange={(open) => {
            setEntryOpen(open);
            setFormError(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" aria-hidden />
              Add entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add entry</DialogTitle>
                <DialogDescription>
                  Log income or an expense. Data is saved to your account.
                </DialogDescription>
              </DialogHeader>
              {formError && entryOpen ? (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="entry-title">Title</Label>
                <Input
                  id="entry-title"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-amount">Amount (Rs)</Label>
                <Input
                  id="entry-amount"
                  type="number"
                  min={1}
                  step={1}
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={entryType}
                  onValueChange={(value) =>
                    setEntryType(value as MoneyEntryType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-category">Category</Label>
                {categories.length > 0 ? (
                  <Select
                    value={entryCategory || undefined}
                    onValueChange={setEntryCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="entry-category"
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    placeholder="e.g. Food"
                    required
                  />
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={categoryOpen}
          onOpenChange={(open) => {
            setCategoryOpen(open);
            setFormError(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add category</DialogTitle>
                <DialogDescription>
                  Set a spending limit for a budget category.
                </DialogDescription>
              </DialogHeader>
              {formError && categoryOpen ? (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-limit">Limit (Rs)</Label>
                <Input
                  id="category-limit"
                  type="number"
                  min={0}
                  step={1}
                  value={categoryLimit}
                  onChange={(e) => setCategoryLimit(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <BudgetSummary summary={summary} />
      <SpendingChart days={days} />
      <CategoryList categories={categorySpend} />
      <ExpenseList expenses={recent} />
    </div>
  );
}
