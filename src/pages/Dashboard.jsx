import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
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
import { TrendingDown, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { expenses, setExpenses } = useExpenseStore();
  const { udhaariList, setUdhaariList } = useUdhaariStore();
  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [loading, setLoading] = useState(true);

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

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalLent = udhaariList
    .filter((i) => i.type === "Lent" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header title="Dashboard" />

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <BudgetProgressBar spent={totalSpent} budget={monthlyBudget} />

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            title="Total Spent"
            amount={totalSpent}
            icon={TrendingDown}
            colorClass="bg-red-50 text-red-600"
          />
          <SummaryCard
            title="To Receive"
            amount={totalLent}
            icon={ArrowUpRight}
            colorClass="bg-emerald-50 text-emerald-600"
            subtitle="Lent Udhaari"
          />
          <SummaryCard
            title="To Pay"
            amount={totalBorrowed}
            icon={ArrowDownLeft}
            colorClass="bg-amber-50 text-amber-600"
            subtitle="Borrowed Udhaari"
          />
          <SummaryCard
            title="Total Items"
            amount={expenses.length}
            icon={Receipt}
            colorClass="bg-teal-50 text-teal-600"
            subtitle="Transactions"
          />
        </div>

        {/* Recent Transactions Section */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800">Recent Transactions</h2>
            <Link to="/expenses" className="text-xs font-semibold text-teal-600 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-sm text-slate-400 py-4">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">No expenses added yet.</p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {exp.category === "Other" ? exp.customCategory : exp.category}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(exp.date)} • {exp.paymentMode}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;