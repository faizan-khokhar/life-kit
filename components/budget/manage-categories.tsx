"use client";

import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

const BUDGET_HREF = "/budget" as Route;
import {
  addBudgetCategory,
  deleteBudgetCategory,
  updateBudgetCategory,
} from "@/lib/data/budget";
import { useBudgetData } from "@/lib/data/use-budget-data";
import type { BudgetCategory } from "@/lib/data/types";
import { formatPKR } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ManageCategories() {
  const { uid, categories, setCategories, loading, error, reload } =
    useBudgetData();

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!uid) return;
    setFormError(null);
    const limitNum = Number(limit);
    if (!name.trim() || !Number.isFinite(limitNum) || limitNum < 0) {
      setFormError("Enter a name and a non-negative limit.");
      return;
    }
    setSaving(true);
    try {
      const created = await addBudgetCategory(uid, {
        name: name.trim(),
        limit: limitNum,
        isFixed,
      });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setLimit("");
      setIsFixed(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(category: BudgetCategory, patch: {
    name?: string;
    limit?: number;
    isFixed?: boolean;
  }) {
    if (!uid) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateBudgetCategory(uid, category.id, patch);
      setCategories((prev) =>
        prev
          .map((c) =>
            c.id === category.id
              ? {
                  ...c,
                  name: patch.name ?? c.name,
                  limit: patch.limit ?? c.limit,
                  isFixed: patch.isFixed ?? c.isFixed,
                  updatedAt: new Date(),
                }
              : c,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: BudgetCategory) {
    if (!uid) return;
    if (
      !window.confirm(
        `Delete “${category.name}”? Past expenses stay in history.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await deleteBudgetCategory(uid, category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not delete category.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={BUDGET_HREF} aria-label="Back to Budget">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Manage categories
          </h2>
          <p className="text-sm text-muted-foreground">
            Limits, fixed payments, and names
          </p>
        </div>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add category</CardTitle>
          <CardDescription>
            Set a monthly limit. Mark fixed for rent-style full payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-cat-name">Name</Label>
              <Input
                id="new-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fuel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cat-limit">Monthly limit (Rs)</Label>
              <Input
                id="new-cat-limit"
                type="number"
                min={0}
                step={1}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Fixed payment</p>
                <p className="text-xs text-muted-foreground">
                  One-tap Mark paid for the full limit
                </p>
              </div>
              <Switch
                checked={isFixed}
                onCheckedChange={setIsFixed}
                aria-label="Fixed payment"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving…" : "Add category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Your categories</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add one above.
          </p>
        ) : (
          categories.map((category) => (
            <CategoryEditCard
              key={category.id}
              category={category}
              editing={editingId === category.id}
              saving={saving}
              onEdit={() => setEditingId(category.id)}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => void saveEdit(category, patch)}
              onDelete={() => void handleDelete(category)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryEditCard({
  category,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  category: BudgetCategory;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: { name: string; limit: number; isFixed: boolean }) => void;
  onDelete: () => void;
}) {
  if (!editing) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {category.name}
              {category.isFixed ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Fixed
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              Limit {formatPKR(category.limit)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${category.name}`}
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CategoryEditForm
      key={category.id}
      category={category}
      saving={saving}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}

function CategoryEditForm({
  category,
  saving,
  onCancel,
  onSave,
}: {
  category: BudgetCategory;
  saving: boolean;
  onCancel: () => void;
  onSave: (patch: { name: string; limit: number; isFixed: boolean }) => void;
}) {
  const [editName, setEditName] = useState(category.name);
  const [editLimit, setEditLimit] = useState(String(category.limit));
  const [editFixed, setEditFixed] = useState(category.isFixed);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor={`edit-name-${category.id}`}>Name</Label>
          <Input
            id={`edit-name-${category.id}`}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`edit-limit-${category.id}`}>Limit (Rs)</Label>
          <Input
            id={`edit-limit-${category.id}`}
            type="number"
            min={0}
            step={1}
            value={editLimit}
            onChange={(e) => setEditLimit(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`edit-fixed-${category.id}`}>Fixed payment</Label>
          <Switch
            id={`edit-fixed-${category.id}`}
            checked={editFixed}
            onCheckedChange={setEditFixed}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => {
              const limitNum = Number(editLimit);
              if (
                !editName.trim() ||
                !Number.isFinite(limitNum) ||
                limitNum < 0
              ) {
                return;
              }
              onSave({
                name: editName.trim(),
                limit: limitNum,
                isFixed: editFixed,
              });
            }}
          >
            Save
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
