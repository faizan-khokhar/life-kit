"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { getBudgetCategories } from "@/features/budget/data/budget";
import { getExpenses } from "@/features/budget/data/expenses";
import type { BudgetCategory, MoneyEntry } from "@/features/budget/data/types";

export function useBudgetData() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!uid) {
        await Promise.resolve();
        if (cancelled) return;
        setCategories([]);
        setEntries([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        const [nextCategories, nextEntries] = await Promise.all([
          getBudgetCategories(uid),
          getExpenses(uid),
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
  }, [uid, reloadToken]);

  return {
    uid,
    categories,
    setCategories,
    entries,
    setEntries,
    loading,
    error,
    reload,
  };
}
