import React, { useState, useMemo } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import PullToRefresh from "../components/common/PullToRefresh";
import { useExpenseStore } from "../store/expenseStore";
import { useSwipeDelete } from "../hooks/useSwipeDelete";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateHelpers";
import { Search, Trash2, Edit2, X, Receipt, Tag, Clock } from "lucide-react";
import { db } from "../services/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const ExpenseList = () => {
  const { currentUser } = useAuth();
  const { expenses } = useExpenseStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("All");
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Data refreshed!", { duration: 1500 });
    }, 500);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const {
    swipedId,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDelete,
    handleCancel,
  } = useSwipeDelete(handleDeleteExpense);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const categoryName = (exp.category === "Other" ? exp.customCategory : exp.category) || "";
      const note = exp.note || "";
      const matchesSearch =
        categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment =
        filterPayment === "All" || exp.paymentMode === filterPayment;

      return matchesSearch && matchesPayment;
    });
  }, [expenses, searchTerm, filterPayment]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <Header title="All Expenses" />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
          {/* Controls: Search & Payment Mode Filters */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search category or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all shadow-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Filter Buttons */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              {["All", "Online", "Offline"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterPayment(mode)}
                  className={`rounded-xl py-1.5 text-xs font-bold transition-all ${
                    filterPayment === mode
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          {filteredExpenses.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900/50 p-10 text-center shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {searchTerm ? "No matching expenses found" : "No expenses recorded yet"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Try clearing filters or adding new transactions.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all"
                  onTouchStart={(e) => handleTouchStart(e, exp.id)}
                  onTouchMove={(e) => handleTouchMove(e, exp.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, exp.id)}
                >
                  {/* Swipe Delete Overlay */}
                  {swipedId === exp.id && (
                    <div className="absolute inset-0 flex items-center justify-end gap-2 bg-red-500/10 dark:bg-red-950/40 backdrop-blur-xs px-3 z-30 animate-in fade-in duration-150">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="p-4 flex items-center justify-between gap-3">
                    {/* Details Container */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          <Tag className="h-3 w-3" />
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {exp.category === "Other" ? (exp.customCategory || "Other") : (exp.category || "Uncategorized")}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                          {exp.paymentMode}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{formatDate(exp.date)}</span>
                        {exp.time && (
                          <>
                            <span>•</span>
                            <span>{exp.time}</span>
                          </>
                        )}
                      </div>

                      {exp.note && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate pl-0.5">
                          "{exp.note}"
                        </p>
                      )}
                    </div>

                    {/* Amount & Quick Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">
                        -{formatCurrency(exp.amount)}
                      </span>

                      <div className="flex items-center gap-0.5 border-l border-slate-100 dark:border-slate-800 pl-2">
                        <Link
                          to={`/add-expense/${exp.id}`}
                          className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </PullToRefresh>

      <BottomNav />
    </div>
  );
};

export default ExpenseList;