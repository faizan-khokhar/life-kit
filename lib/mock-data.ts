export type BudgetSummary = {
  monthLabel: string;
  income: number;
  expenses: number;
  remaining: number;
};

export type SpendingDay = {
  label: string;
  amount: number;
};

export type BudgetCategory = {
  id: string;
  name: string;
  spent: number;
  budget: number;
};

export type ExpenseItem = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
  type: "expense" | "income" | "task" | "note";
  time: string;
};

export const budgetSummary: BudgetSummary = {
  monthLabel: "This month",
  income: 250_000,
  expenses: 145_500,
  remaining: 104_500,
};

export const spendingByDay: SpendingDay[] = [
  { label: "Mon", amount: 4200 },
  { label: "Tue", amount: 7800 },
  { label: "Wed", amount: 3500 },
  { label: "Thu", amount: 9100 },
  { label: "Fri", amount: 12400 },
  { label: "Sat", amount: 6800 },
  { label: "Sun", amount: 5200 },
];

export const categories: BudgetCategory[] = [
  { id: "food", name: "Food", spent: 42_000, budget: 50_000 },
  { id: "transport", name: "Transport", spent: 18_500, budget: 25_000 },
  { id: "shopping", name: "Shopping", spent: 31_000, budget: 40_000 },
  { id: "bills", name: "Bills", spent: 54_000, budget: 60_000 },
];

export const recentExpenses: ExpenseItem[] = [
  {
    id: "e1",
    title: "Grocery run",
    category: "Food",
    amount: 4_850,
    date: "Today",
  },
  {
    id: "e2",
    title: "Ride to office",
    category: "Transport",
    amount: 650,
    date: "Today",
  },
  {
    id: "e3",
    title: "Electricity bill",
    category: "Bills",
    amount: 8_200,
    date: "Yesterday",
  },
  {
    id: "e4",
    title: "New headphones",
    category: "Shopping",
    amount: 12_500,
    date: "2 days ago",
  },
  {
    id: "e5",
    title: "Lunch with team",
    category: "Food",
    amount: 2_400,
    date: "3 days ago",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    title: "Grocery run",
    subtitle: "Food · Budget",
    amount: -4_850,
    type: "expense",
    time: "2h ago",
  },
  {
    id: "a2",
    title: "Salary deposited",
    subtitle: "Income · Budget",
    amount: 250_000,
    type: "income",
    time: "Yesterday",
  },
  {
    id: "a3",
    title: "Finish project proposal",
    subtitle: "Tasks",
    type: "task",
    time: "Yesterday",
  },
  {
    id: "a4",
    title: "Weekend trip ideas",
    subtitle: "Notes",
    type: "note",
    time: "2 days ago",
  },
  {
    id: "a5",
    title: "Ride to office",
    subtitle: "Transport · Budget",
    amount: -650,
    type: "expense",
    time: "3 days ago",
  },
  {
    id: "a6",
    title: "Electricity bill",
    subtitle: "Bills · Budget",
    amount: -8_200,
    type: "expense",
    time: "4 days ago",
  },
];

export const dashboardOverview = {
  thisMonth: budgetSummary.income,
  spending: budgetSummary.expenses,
  remaining: budgetSummary.remaining,
};
