import React, { useState } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useExpenseStore } from "../store/expenseStore";
import { useSwipeDelete } from "../hooks/useSwipeDelete";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateHelpers";
import { Search, Filter, Trash2, Edit2 } from "lucide-react";
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

  const filteredExpenses = expenses.filter((exp) => {
    const categoryName = exp.category === "Other" ? exp.customCategory : exp.category;
    const matchesSearch =
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPayment =
      filterPayment === "All" || exp.paymentMode === filterPayment;

    return matchesSearch && matchesPayment;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="All Expenses" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        {/* Search & Filter Controls */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search category or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            {["All", "Online", "Offline"].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterPayment(mode)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-medium border transition-all ${
                  filterPayment === mode
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Expense Cards List */}
        {filteredExpenses.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-400 dark:text-slate-500">No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="relative overflow-hidden rounded-2xl"
                onTouchStart={(e) => handleTouchStart(e, exp.id)}
                onTouchMove={(e) => handleTouchMove(e, exp.id)}
                onTouchEnd={(e) => handleTouchEnd(e, exp.id)}
              >
                {/* Delete Action Overlay */}
                {swipedId === exp.id && (
                  <div className="absolute inset-0 flex items-center justify-end gap-2 bg-red-50 dark:bg-red-900/20 z-30">
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white text-xs font-semibold rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 mr-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Expense Card */}
                <div
                  className={`flex items-center justify-between rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-transform ${
                    swipedId === exp.id ? "translate-x-0" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        {exp.category === "Other" ? exp.customCategory : exp.category}
                      </h3>
                      <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {exp.paymentMode}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(exp.date)} {exp.time ? `• ${exp.time}` : ""}
                    </p>
                    {exp.note && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 italic">{exp.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      -{formatCurrency(exp.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        to={`/add-expense/${exp.id}`}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ExpenseList;