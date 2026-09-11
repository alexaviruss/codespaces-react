import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useBudgetStore } from "../store/budgetStore";
import { db } from "../services/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { formatCurrency } from "../utils/currencyFormatter";
import toast from "react-hot-toast";
import { IndianRupee, Save, BellRing } from "lucide-react";

const BudgetSettings = () => {
  const { currentUser } = useAuth();
  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [budgetInput, setBudgetInput] = useState(monthlyBudget);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    // Realtime, same as Dashboard - keeps this page in sync even if the
    // budget is changed elsewhere without needing a remount.
    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists() && snap.data()?.profile?.monthlyBudget) {
        const current = snap.data().profile.monthlyBudget;
        setMonthlyBudget(current);
        setBudgetInput(current);
      }
    });
    return unsubscribe;
  }, [currentUser, setMonthlyBudget]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!budgetInput || Number(budgetInput) <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        "profile.monthlyBudget": Number(budgetInput),
      });

      setMonthlyBudget(Number(budgetInput));
      toast.success("Budget updated successfully!");
    } catch (error) {
      toast.error("Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Budget Settings" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Monthly Budget Limit
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="number"
                required
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-10 pr-4 text-base font-bold text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Current limit: {formatCurrency(monthlyBudget)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-3 border border-slate-100 dark:border-slate-600 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <BellRing className="h-4 w-4 text-teal-600" /> Threshold Alerts
            </div>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>70% utilization shows a heads-up tip.</li>
              <li>90% utilization triggers a warning notification.</li>
              <li>100% utilization triggers a red budget limit notification.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Updating..." : "Save Budget"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default BudgetSettings;