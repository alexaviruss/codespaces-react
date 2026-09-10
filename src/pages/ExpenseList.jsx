import React, { useState } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useExpenseStore } from "../store/expenseStore";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateHelpers";
import { Search, Filter, Trash2 } from "lucide-react";
import { db } from "../services/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ExpenseList = () => {
  const { currentUser } = useAuth();
  const { expenses } = useExpenseStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("All");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

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
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header title="All Expenses" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        {/* Search & Filter Controls */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:border-teal-600 focus:outline-none shadow-sm"
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
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Expense Cards List */}
        {filteredExpenses.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <p className="text-sm text-slate-400">No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      {exp.category === "Other" ? exp.customCategory : exp.category}
                    </h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">
                      {exp.paymentMode}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(exp.date)} {exp.time ? `• ${exp.time}` : ""}
                  </p>
                  {exp.note && (
                    <p className="mt-0.5 text-xs text-slate-500 italic">{exp.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-900">
                    -{formatCurrency(exp.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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