import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getCurrentDate, getCurrentTime } from "../utils/dateHelpers";
import toast from "react-hot-toast";
import { IndianRupee, Calendar, Clock, CreditCard, Tag, FileText } from "lucide-react";

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

  const [category, setCategory] = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [paymentMode, setPaymentMode] = useState("Online");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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
      await addDoc(collection(db, "users", currentUser.uid, "expenses"), {
        category,
        customCategory: category === "Other" ? customCategory.trim() : "",
        amount: Number(amount),
        date,
        time,
        paymentMode,
        note: note.trim(),
        createdAt: serverTimestamp(),
      });

      toast.success("Expense added successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header title="Add Expense" />

      <main className="px-4 py-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-lg font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors appearance-none"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Specify Category
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Books, Gift"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode("Online")}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  paymentMode === "Online"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
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
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <IndianRupee className="h-4 w-4" />
                Cash / Offline
              </button>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Note (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dinner with friends"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50"
          >
            {loading ? "Saving Expense..." : "Save Expense"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddExpense;