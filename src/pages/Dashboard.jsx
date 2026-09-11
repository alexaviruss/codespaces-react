import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import FAB from "../components/common/FAB";
import PullToRefresh from "../components/common/PullToRefresh";
import { DashboardSkeleton } from "../components/common/SkeletonLoader";
import SummaryCard from "../components/analytics/SummaryCard";
import BudgetProgressBar from "../components/analytics/BudgetProgressBar";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useExpenseStore } from "../store/expenseStore";
import { useUdhaariStore } from "../store/udhaariStore";
import { useBudgetStore } from "../store/budgetStore";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateHelpers";
import { checkBudgetAlert } from "../utils/budgetAlerts";
import { TrendingDown, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
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

    // Fetch user budget profile
    const fetchBudget = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.profile?.monthlyBudget) {
        setMonthlyBudget(userSnap.data().profile.monthlyBudget);
      }
    };

    fetchBudget();

    // Fetch Expenses Realtime
    const expQuery = query(
      collection(db, "users", currentUser.uid, "expenses")
    );
    const unsubscribeExpenses = onSnapshot(expQuery, (snapshot) => {
      const expData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expData);
    });

    // Fetch Udhaari Realtime
    const udhaariQuery = query(
      collection(db, "users", currentUser.uid, "udhaari")
    );
    const unsubscribeUdhaari = onSnapshot(udhaariQuery, (snapshot) => {
      const udData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUdhaariList(udData);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeUdhaari();
    };
  }, [currentUser, setExpenses, setUdhaariList, setMonthlyBudget]);

  // Show budget alert
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

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalLent = udhaariList
    .filter((i) => i.type === "Lent" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
        <Header title="Dashboard" />
        <DashboardSkeleton />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Dashboard" />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
          <BudgetProgressBar spent={totalSpent} budget={monthlyBudget} />

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title="Total Spent"
              amount={totalSpent}
              icon={TrendingDown}
              colorClass="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            />
            <SummaryCard
              title="To Receive"
              amount={totalLent}
              icon={ArrowUpRight}
              colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              subtitle="Lent Udhaari"
            />
            <SummaryCard
              title="To Pay"
              amount={totalBorrowed}
              icon={ArrowDownLeft}
              colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              subtitle="Borrowed Udhaari"
            />
            <SummaryCard
              title="Total Items"
              amount={expenses.length}
              icon={Receipt}
              colorClass="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
              subtitle="Transactions"
            />
          </div>

          {/* Recent Transactions Section */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
              <Link to="/expenses" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                View All
              </Link>
            </div>

            {expenses.length === 0 ? (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">No expenses added yet.</p>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {exp.category === "Other" ? exp.customCategory : exp.category}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(exp.date)} • {exp.paymentMode}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </PullToRefresh>

      <FAB />
      <BottomNav />
    </div>
  );
};

export default Dashboard;