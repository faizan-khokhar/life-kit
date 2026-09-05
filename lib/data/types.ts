/** Document shapes for Firestore repositories. No Firebase imports here. */

export type MoneyEntryType = "income" | "expense";

export type BudgetCategory = {
  id: string;
  name: string;
  /** Monthly spending limit for this category. */
  limit: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetCategoryInput = {
  name: string;
  limit: number;
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
};

export type ExpenseListItemView = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
};
