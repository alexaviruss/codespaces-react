import { create } from "zustand";

export const useRecurringExpenseStore = create((set) => ({
  recurringExpenses: [],
  setRecurringExpenses: (expenses) => set({ recurringExpenses: expenses }),
  addRecurringExpense: (expense) =>
    set((state) => ({
      recurringExpenses: [...state.recurringExpenses, expense],
    })),
  updateRecurringExpense: (id, updatedExpense) =>
    set((state) => ({
      recurringExpenses: state.recurringExpenses.map((exp) =>
        exp.id === id ? { ...exp, ...updatedExpense } : exp
      ),
    })),
  deleteRecurringExpense: (id) =>
    set((state) => ({
      recurringExpenses: state.recurringExpenses.filter((exp) => exp.id !== id),
    })),
}));
