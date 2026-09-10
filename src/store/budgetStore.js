import { create } from "zustand";

export const useBudgetStore = create((set) => ({
  monthlyBudget: 10000,
  setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
}));