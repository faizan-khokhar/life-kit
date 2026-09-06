import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Calculator,
  CalendarDays,
  CheckSquare,
  CreditCard,
  FileText,
  PiggyBank,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";

export type ModuleStatus = "available" | "coming-soon";
export type ModuleCategory = "finance" | "personal" | "tools";

export type Module = {
  id: string;
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
  category: ModuleCategory;
  status: ModuleStatus;
};

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
};

export const modules: Module[] = [
  {
    id: "budget",
    title: "Budget",
    description: "Track income, spending, and what is left this month.",
    href: "/budget",
    icon: Wallet,
    category: "finance",
    status: "available",
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "Log everyday spending with categories and notes.",
    href: "/expenses",
    icon: Receipt,
    category: "finance",
    status: "coming-soon",
  },
  {
    id: "bills",
    title: "Bills",
    description: "Never miss a due date for recurring payments.",
    href: "/bills",
    icon: CreditCard,
    category: "finance",
    status: "coming-soon",
  },
  {
    id: "savings",
    title: "Savings",
    description: "Set aside money and watch your goals grow.",
    href: "/savings",
    icon: PiggyBank,
    category: "finance",
    status: "coming-soon",
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Capture to-dos and knock them out one by one.",
    href: "/tasks",
    icon: CheckSquare,
    category: "personal",
    status: "coming-soon",
  },
  {
    id: "goals",
    title: "Goals",
    description: "Define personal targets and track progress.",
    href: "/goals",
    icon: Target,
    category: "personal",
    status: "coming-soon",
  },
  {
    id: "planner",
    title: "Planner",
    description: "Plan your day and week at a glance.",
    href: "/planner",
    icon: CalendarDays,
    category: "personal",
    status: "coming-soon",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Jot down thoughts, lists, and quick ideas.",
    href: "/notes",
    icon: FileText,
    category: "personal",
    status: "available",
  },
  {
    id: "calculator",
    title: "Calculator",
    description: "A clean calculator for everyday math.",
    href: "/calculator",
    icon: Calculator,
    category: "tools",
    status: "coming-soon",
  },
  {
    id: "converter",
    title: "Converter",
    description: "Convert units, currency, and more.",
    href: "/converter",
    icon: ArrowLeftRight,
    category: "tools",
    status: "coming-soon",
  },
];

export const categoryLabels: Record<ModuleCategory, string> = {
  finance: "Finance",
  personal: "Personal",
  tools: "Tools",
};

export const categoryOrder: ModuleCategory[] = [
  "finance",
  "personal",
  "tools",
];

export const featuredModuleIds = ["budget", "tasks", "goals", "notes"] as const;

export const sidebarPrimaryIds = [
  "budget",
  "tasks",
  "goals",
  "planner",
  "notes",
] as const;

export const sidebarToolIds = ["calculator", "converter"] as const;

export const quickActions: QuickAction[] = [
  {
    id: "add-expense",
    title: "Add Expense",
    description: "Record a new spending entry",
    href: "/budget",
    icon: Receipt,
  },
  {
    id: "add-income",
    title: "Add Income",
    description: "Log money coming in",
    href: "/budget",
    icon: Wallet,
  },
  {
    id: "add-task",
    title: "Add Task",
    description: "Create a new to-do",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    id: "add-note",
    title: "Add Note",
    description: "Capture a quick thought",
    href: "/notes",
    icon: FileText,
  },
];

export function getModule(id: string): Module {
  const mod = modules.find((m) => m.id === id);
  if (!mod) {
    throw new Error(`Unknown module: ${id}`);
  }
  return mod;
}

export function getModuleByHref(href: string): Module | undefined {
  return modules.find((m) => m.href === href);
}

export function getModulesByCategory(category: ModuleCategory): Module[] {
  return modules.filter((m) => m.category === category);
}

export function getFeaturedModules(): Module[] {
  return featuredModuleIds.map((id) => getModule(id));
}

export function getSidebarPrimaryModules(): Module[] {
  return sidebarPrimaryIds.map((id) => getModule(id));
}

export function getSidebarToolModules(): Module[] {
  return sidebarToolIds.map((id) => getModule(id));
}
