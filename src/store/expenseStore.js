import { create } from "zustand";

export const useExpenseStore = create((set) => ({
  expenses: [],
  loading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpenseStore: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  setLoading: (loading) => set({ loading }),
}));