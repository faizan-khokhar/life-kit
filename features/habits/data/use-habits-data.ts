"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deriveHabitsForDay,
  dayProgress,
  toDateKey,
  toggleLog,
} from "@/features/habits/data/habits";
import {
  addHabit as addHabitDoc,
  deleteHabit as deleteHabitDoc,
  getHabitLogs,
  getHabits,
  toggleHabitLog,
  updateHabit as updateHabitDoc,
} from "@/features/habits/data/habits-repo";
import type { Habit, HabitInput, HabitLog } from "@/features/habits/data/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { useLocalDb } from "@/lib/local-db/local-db-provider";

export function useHabitsData(selectedDate: string = toDateKey()) {
  const { user } = useAuth();
  const { ready: localReady, error: localError } = useLocalDb();
  const uid = user?.uid;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
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
        setHabits([]);
        setLogs([]);
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
        const [nextHabits, nextLogs] = await Promise.all([
          getHabits(uid),
          getHabitLogs(uid),
        ]);
        if (cancelled) return;
        setHabits(nextHabits);
        setLogs(nextLogs);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load habits.",
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

  const habitsForDay = useMemo(
    () => deriveHabitsForDay(habits, logs, selectedDate),
    [habits, logs, selectedDate],
  );

  const progress = useMemo(
    () => dayProgress(habitsForDay),
    [habitsForDay],
  );

  const allHabits = useMemo(
    () =>
      [...habits].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    [habits],
  );

  const toggleToday = useCallback(
    async (habitId: string) => {
      if (!uid) return;
      setError(null);
      const previous = logs;
      setLogs((prev) => toggleLog(prev, habitId, selectedDate));
      try {
        const next = await toggleHabitLog(uid, habitId, selectedDate);
        setLogs((prev) => {
          const others = prev.filter((log) => log.id !== next.id);
          return [...others, next];
        });
      } catch (err) {
        setLogs(previous);
        setError(
          err instanceof Error ? err.message : "Could not update habit.",
        );
      }
    },
    [uid, logs, selectedDate],
  );

  const addHabit = useCallback(
    async (input: HabitInput) => {
      if (!uid) return null;
      const name = input.name.trim();
      if (!name) return null;
      setError(null);
      try {
        const habit = await addHabitDoc(uid, { ...input, name });
        setHabits((prev) => [...prev, habit]);
        return habit;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add habit.");
        return null;
      }
    },
    [uid],
  );

  const updateHabit = useCallback(
    async (id: string, patch: Partial<HabitInput & { active: boolean }>) => {
      if (!uid) return false;
      setError(null);
      const previous = habits;
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;
          return {
            ...h,
            name:
              patch.name !== undefined
                ? patch.name.trim() || h.name
                : h.name,
            active: patch.active ?? h.active,
            updatedAt: new Date(),
          };
        }),
      );
      try {
        await updateHabitDoc(uid, id, patch);
        return true;
      } catch (err) {
        setHabits(previous);
        setError(
          err instanceof Error ? err.message : "Could not update habit.",
        );
        return false;
      }
    },
    [uid, habits],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      if (!uid) return false;
      setError(null);
      const previousHabits = habits;
      const previousLogs = logs;
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setLogs((prev) => prev.filter((l) => l.habitId !== id));
      try {
        await deleteHabitDoc(uid, id);
        return true;
      } catch (err) {
        setHabits(previousHabits);
        setLogs(previousLogs);
        setError(
          err instanceof Error ? err.message : "Could not delete habit.",
        );
        return false;
      }
    },
    [uid, habits, logs],
  );

  return {
    uid,
    habits: allHabits,
    habitsForDay,
    logs,
    progress,
    selectedDate,
    loading,
    error,
    reload,
    toggleToday,
    addHabit,
    updateHabit,
    deleteHabit,
  };
}
