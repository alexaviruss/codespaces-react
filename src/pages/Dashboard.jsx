import React, { useEffect, useState, useCallback, useMemo } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import PullToRefresh from "../components/common/PullToRefresh";
import { DashboardSkeleton } from "../components/common/SkeletonLoader";
import SummaryCard from "../components/analytics/SummaryCard";
import BudgetProgressBar from "../components/analytics/BudgetProgressBar";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { useExpenseStore } from "../store/expenseStore";
import { useUdhaariStore } from "../store/udhaariStore";
import { useBudgetStore } from "../store/budgetStore";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateHelpers";
import { checkBudgetAlert } from "../utils/budgetAlerts";
import { sumRemainingByType } from "../utils/udhaariHelpers";
import {
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  BarChart3,
  ChevronRight,
  CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { expenses, setExpenses } = useExpenseStore();
  const { udhaariList, setUdhaariList } = useUdhaariStore();
  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [loading, setLoading] = useState(true);
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribeBudget = onSnapshot(userRef, (snap) => {
      if (snap.exists() && snap.data()?.profile?.monthlyBudget) {
        setMonthlyBudget(snap.data().profile.monthlyBudget);
      }
    });

    const expQuery = query(collection(db, "users", currentUser.uid, "expenses"));
    const unsubscribeExpenses = onSnapshot(expQuery, (snapshot) => {
      const expData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expData);
    });

    const udhaariQuery = query(collection(db, "users", currentUser.uid, "udhaari"));
    const unsubscribeUdhaari = onSnapshot(udhaariQuery, (snapshot) => {
      const udData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUdhaariList(udData);
      setLoading(false);
    });

    return () => {
      unsubscribeBudget();
      unsubscribeExpenses();
      unsubscribeUdhaari();
    };
  }, [currentUser, setExpenses, setUdhaariList, setMonthlyBudget]);

  useEffect(() => {
    if (!alertShown && expenses.length > 0 && monthlyBudget > 0) {
      const totalSpent = expenses.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      checkBudgetAlert(totalSpent, monthlyBudget);
      setAlertShown(true);
    }
  }, [expenses, monthlyBudget, alertShown]);

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        toast.success("Data refreshed!", { duration: 1500 });
      }, 500);
    } catch (error) {
      toast.error("Failed to refresh data");
      setLoading(false);
    }
  }, []);

  const totalSpent = useMemo(
    () => expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    [expenses]
  );
  const totalLent = useMemo(() => sumRemainingByType(udhaariList, "Lent"), [udhaariList]);
  const totalBorrowed = useMemo(() => sumRemainingByType(udhaariList, "Borrowed"), [udhaariList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <Header title="Dashboard" />
        <DashboardSkeleton />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <Header title="Dashboard" />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-5 space-y-5 max-w-lg mx-auto">
          {/* Monthly Budget Card Wrapper */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <BudgetProgressBar spent={totalSpent} budget={monthlyBudget} />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title="Total Spent"
              amount={totalSpent}
              icon={TrendingDown}
              colorClass="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            />
            <SummaryCard
              title="To Receive"
              amount={totalLent}
              icon={ArrowUpRight}
              colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              subtitle="Lent Udhaari"
            />
            <SummaryCard
              title="To Pay"
              amount={totalBorrowed}
              icon={ArrowDownLeft}
              colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              subtitle="Borrowed Udhaari"
            />
            <SummaryCard
              title="Total Items"
              amount={expenses.length}
              icon={Receipt}
              colorClass="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
              subtitle="Transactions"
              isCurrency={false}
            />
          </div>

          {/* Navigation Banner for Analytics */}
          <Link
            to="/analytics"
            className="group relative flex items-center justify-between rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40 transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  View Analytics
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Spending trends & category breakdown
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Recent Transactions List */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Transactions
              </h2>
              <Link
                to="/expenses"
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-0.5"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {expenses.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No expenses added yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {expenses.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0 group"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {exp.category === "Other" ? exp.customCategory : exp.category}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {formatDate(exp.date)} <span className="opacity-40">•</span> {exp.paymentMode}
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </PullToRefresh>

      <BottomNav />
    </div>
  );
};

export default Dashboard;