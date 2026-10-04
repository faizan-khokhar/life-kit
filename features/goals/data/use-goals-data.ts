"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deriveGoalsWithUpdates,
  filterGoals,
  reviewWeekSundayKey,
  sortGoals,
  updateId,
} from "@/features/goals/data/goals";
import {
  addGoal as addGoalDoc,
  deleteGoal as deleteGoalDoc,
  getGoalUpdates,
  getGoals,
  updateGoal as updateGoalDoc,
  upsertGoalUpdate,
} from "@/features/goals/data/goals-repo";
import type {
  Goal,
  GoalFilter,
  GoalInput,
  GoalUpdate,
} from "@/features/goals/data/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { useLocalDb } from "@/lib/local-db/local-db-provider";

export function useGoalsData() {
  const { user } = useAuth();
  const { ready: localReady, error: localError } = useLocalDb();
  const uid = user?.uid;

  const weekKey = useMemo(() => reviewWeekSundayKey(), []);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<GoalUpdate[]>([]);
  const [filter, setFilter] = useState<GoalFilter>("active");
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
        setGoals([]);
        setUpdates([]);
        setLoading(false);
        setError(null);
        return;
      }

      if (!localReady) {
        setLoading(true);
        if (localError) setError(localError);
        return;
      }

      try {
        const [nextGoals, nextUpdates] = await Promise.all([
          getGoals(uid),
          getGoalUpdates(uid),
        ]);
        if (cancelled) return;
        setGoals(nextGoals);
        setUpdates(nextUpdates);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load goals.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [uid, reloadToken, localReady, localError]);

  const goalsWithUpdates = useMemo(
    () => deriveGoalsWithUpdates(goals, updates, weekKey),
    [goals, updates, weekKey],
  );

  const visibleGoals = useMemo(
    () => sortGoals(filterGoals(goalsWithUpdates, filter)),
    [goalsWithUpdates, filter],
  );

  const activeGoals = useMemo(
    () => goalsWithUpdates.filter((g) => g.status === "active"),
    [goalsWithUpdates],
  );

  const addGoal = useCallback(
    async (input: GoalInput) => {
      if (!uid) return null;
      const title = input.title.trim();
      if (!title) return null;
      setError(null);
      try {
        const goal = await addGoalDoc(uid, { ...input, title });
        setGoals((prev) => [...prev, goal]);
        return goal;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add goal.");
        return null;
      }
    },
    [uid],
  );

  const updateGoal = useCallback(
    async (id: string, patch: Partial<GoalInput>) => {
      if (!uid) return false;
      setError(null);
      const previous = goals;
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g;
          return {
            ...g,
            title:
              patch.title !== undefined
                ? patch.title.trim() || g.title
                : g.title,
            description:
              patch.description !== undefined
                ? patch.description.trim()
                : g.description,
            category: patch.category ?? g.category,
            deadline:
              patch.deadline !== undefined ? patch.deadline : g.deadline,
            status: patch.status ?? g.status,
            updatedAt: new Date(),
          };
        }),
      );
      try {
        await updateGoalDoc(uid, id, patch);
        return true;
      } catch (err) {
        setGoals(previous);
        setError(
          err instanceof Error ? err.message : "Could not update goal.",
        );
        return false;
      }
    },
    [uid, goals],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!uid) return false;
      setError(null);
      const previousGoals = goals;
      const previousUpdates = updates;
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setUpdates((prev) => prev.filter((u) => u.goalId !== id));
      try {
        await deleteGoalDoc(uid, id);
        return true;
      } catch (err) {
        setGoals(previousGoals);
        setUpdates(previousUpdates);
        setError(
          err instanceof Error ? err.message : "Could not delete goal.",
        );
        return false;
      }
    },
    [uid, goals, updates],
  );

  const logProgress = useCallback(
    async (goalId: string, note: string, date: string = weekKey) => {
      if (!uid) return null;
      const trimmed = note.trim();
      if (!trimmed) return null;
      setError(null);

      const id = updateId(goalId, date);
      const previous = updates;
      const existing = updates.find((u) => u.id === id);
      const now = new Date();
      const optimistic: GoalUpdate = existing
        ? { ...existing, note: trimmed, updatedAt: now }
        : {
            id,
            goalId,
            date,
            note: trimmed,
            createdAt: now,
            updatedAt: now,
          };

      setUpdates((prev) => {
        const others = prev.filter((u) => u.id !== id);
        return [...others, optimistic];
      });

      try {
        const saved = await upsertGoalUpdate(uid, goalId, date, trimmed);
        setUpdates((prev) => {
          const others = prev.filter((u) => u.id !== saved.id);
          return [...others, saved];
        });
        return saved;
      } catch (err) {
        setUpdates(previous);
        setError(
          err instanceof Error ? err.message : "Could not save progress.",
        );
        return null;
      }
    },
    [uid, updates, weekKey],
  );

  return {
    uid,
    weekKey,
    goals: goalsWithUpdates,
    visibleGoals,
    activeGoals,
    filter,
    setFilter,
    loading,
    error,
    reload,
    addGoal,
    updateGoal,
    deleteGoal,
    logProgress,
  };
}
