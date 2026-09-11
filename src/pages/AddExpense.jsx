import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getCurrentDate, getCurrentTime } from "../utils/dateHelpers";
import toast from "react-hot-toast";
import { IndianRupee, Calendar, Clock, CreditCard, Tag, FileText, Trash2 } from "lucide-react";

const CATEGORIES = [
  "Food",
  "Travel",
  "Bus Ticket",
  "Metro Recharge",
  "Grocery",
  "Street Food",
  "Mobile/DTH Recharge",
  "Bills",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

const AddExpense = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { expenseId } = useParams();
  const isEditMode = !!expenseId;

  const [category, setCategory] = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [paymentMode, setPaymentMode] = useState("Online");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && currentUser) {
      const fetchExpense = async () => {
        try {
          const expenseRef = doc(db, "users", currentUser.uid, "expenses", expenseId);
          const expenseSnap = await getDoc(expenseRef);
          
          if (expenseSnap.exists()) {
            const data = expenseSnap.data();
            setCategory(data.category);
            setCustomCategory(data.customCategory || "");
            setAmount(String(data.amount));
            setDate(data.date);
            setTime(data.time);
            setPaymentMode(data.paymentMode);
            setNote(data.note || "");
          }
        } catch (error) {
          console.error("Error fetching expense:", error);
          toast.error("Failed to load expense");
        } finally {
          setInitialLoading(false);
        }
      };

      fetchExpense();
    }
  }, [isEditMode, expenseId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (category === "Other" && !customCategory.trim()) {
      toast.error("Please specify custom category name");
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        category,
        customCategory: category === "Other" ? customCategory.trim() : "",
        amount: Number(amount),
        date,
        time,
        paymentMode,
        note: note.trim(),
      };

      if (isEditMode) {
        // Update existing expense
        const expenseRef = doc(db, "users", currentUser.uid, "expenses", expenseId);
        await updateDoc(expenseRef, expenseData);
        toast.success("Expense updated successfully!");
      } else {
        // Add new expense
        await addDoc(collection(db, "users", currentUser.uid, "expenses"), {
          ...expenseData,
          createdAt: serverTimestamp(),
        });
        toast.success("Expense added successfully!");
      }
      
      navigate("/expenses");
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(isEditMode ? "Failed to update expense" : "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      setLoading(true);
      const expenseRef = doc(db, "users", currentUser.uid, "expenses", expenseId);
      await deleteDoc(expenseRef);
      toast.success("Expense deleted!");
      navigate("/expenses");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
        <Header title={isEditMode ? "Edit Expense" : "Add Expense"} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-slate-300 border-t-teal-600 rounded-full"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title={isEditMode ? "Edit Expense" : "Add Expense"} />

      <main className="px-4 py-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-10 pr-4 text-lg font-bold text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Category Input if "Other" */}
          {category === "Other" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Specify Category
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Books, Gift"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode("Online")}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  paymentMode === "Online"
                    ? "border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("Offline")}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  paymentMode === "Offline"
                    ? "border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                <IndianRupee className="h-4 w-4" />
                Cash / Offline
              </button>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Note (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dinner with friends"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-sm font-semibold text-white shadow-md focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Expense" : "Save Expense")}
            </button>
            
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 rounded-xl bg-red-50 hover:bg-red-100 py-3 text-red-600 shadow-md focus:outline-none transition-all disabled:opacity-50"
                title="Delete expense"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddExpense;