/** Document shapes for Firestore repositories. No Firebase imports here. */

export type MoneyEntryType = "income" | "expense";

export type BudgetCategory = {
  id: string;
  name: string;
  /** Monthly spending limit for this category. */
  limit: number;
  /** When true, UI offers one-tap "Mark paid" for the full limit. */
  isFixed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetCategoryInput = {
  name: string;
  limit: number;
  isFixed?: boolean;
};

export type MoneyEntry = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: MoneyEntryType;
  occurredAt: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MoneyEntryInput = {
  title: string;
  category: string;
  amount: number;
  type: MoneyEntryType;
  occurredAt: Date;
  note?: string;
};

export type BudgetSummaryView = {
  monthLabel: string;
  income: number;
  expenses: number;
  remaining: number;
};

export type SpendingDayView = {
  label: string;
  amount: number;
};

export type CategorySpendView = {
  id: string;
  name: string;
  spent: number;
  budget: number;
  isFixed: boolean;
};

export type ExpenseListItemView = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
};
