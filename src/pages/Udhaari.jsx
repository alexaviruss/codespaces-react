import React, { useState, useCallback, useMemo } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import PullToRefresh from "../components/common/PullToRefresh";
import { useAuth } from "../context/AuthContext";
import { useUdhaariStore } from "../store/udhaariStore";
import { db } from "../services/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate, getCurrentDate } from "../utils/dateHelpers";
import { getPaidAmount, getRemainingAmount, deriveStatus } from "../utils/udhaariHelpers";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Plus,
  User,
  Calendar,
  FileText,
  IndianRupee,
  Wallet,
  Edit3,
  X,
  Search,
  Check,
  Receipt,
  Sparkles,
} from "lucide-react";

const Udhaari = () => {
  const { currentUser } = useAuth();
  const { udhaariList } = useUdhaariStore();

  // Form State
  const [type, setType] = useState("Lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Filter / Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All"); // All | Lent | Borrowed | Settled

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingPaidAmount, setEditingPaidAmount] = useState(0);

  // Inline payment state
  const [paymentOpenId, setPaymentOpenId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Data refreshed!", { duration: 1500 });
    }, 500);
  }, []);

  const resetForm = () => {
    setType("Lent");
    setPersonName("");
    setAmount("");
    setDate(getCurrentDate());
    setNote("");
    setEditingId(null);
    setEditingPaidAmount(0);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setType(item.type);
    setPersonName(item.personName);
    setAmount(String(item.amount));
    setDate(item.date);
    setNote(item.note || "");
    setEditingId(item.id);
    setEditingPaidAmount(getPaidAmount(item));
    setPaymentOpenId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim() || !amount || Number(amount) <= 0) {
      toast.error("Please enter a valid person name and amount");
      return;
    }

    if (editingId && Number(amount) < editingPaidAmount) {
      toast.error(
        `New amount can't be less than paid amount (${formatCurrency(editingPaidAmount)})`
      );
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const newStatus = deriveStatus({ amount: Number(amount), paidAmount: editingPaidAmount });
        await updateDoc(doc(db, "users", currentUser.uid, "udhaari", editingId), {
          type,
          personName: personName.trim(),
          amount: Number(amount),
          date,
          note: note.trim(),
          status: newStatus,
        });
        toast.success("Record updated");
      } else {
        await addDoc(collection(db, "users", currentUser.uid, "udhaari"), {
          type,
          personName: personName.trim(),
          amount: Number(amount),
          paidAmount: 0,
          date,
          note: note.trim(),
          status: "Pending",
          createdAt: serverTimestamp(),
        });
        toast.success("Record created");
      }

      resetForm();
    } catch (error) {
      toast.error(editingId ? "Failed to update record" : "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (id) => {
    setPaymentOpenId(paymentOpenId === id ? null : id);
    setPaymentAmount("");
  };

  const handleAddPayment = async (item) => {
    const value = Number(paymentAmount);
    const remaining = getRemainingAmount(item);

    if (!value || value <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (value > remaining) {
      toast.error(`Payment cannot exceed ${formatCurrency(remaining)}`);
      return;
    }

    try {
      const newPaid = getPaidAmount(item) + value;
      const newStatus = deriveStatus({ amount: item.amount, paidAmount: newPaid });
      await updateDoc(doc(db, "users", currentUser.uid, "udhaari", item.id), {
        paidAmount: newPaid,
        status: newStatus,
      });
      toast.success(
        newStatus === "Settled" ? "Fully settled!" : `Payment of ${formatCurrency(value)} recorded`
      );
      setPaymentOpenId(null);
      setPaymentAmount("");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  const handleToggleSettled = async (item) => {
    const isSettled = deriveStatus(item) === "Settled";
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "udhaari", item.id), {
        paidAmount: isSettled ? 0 : item.amount,
        status: isSettled ? "Pending" : "Settled",
      });
      toast.success(isSettled ? "Reopened record" : "Marked as Settled");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "udhaari", id));
      toast.success("Record deleted");
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  // Calculations
  const totalLent = useMemo(() => {
    return udhaariList
      .filter((i) => i.type === "Lent" && deriveStatus(i) !== "Settled")
      .reduce((acc, curr) => acc + getRemainingAmount(curr), 0);
  }, [udhaariList]);

  const totalBorrowed = useMemo(() => {
    return udhaariList
      .filter((i) => i.type === "Borrowed" && deriveStatus(i) !== "Settled")
      .reduce((acc, curr) => acc + getRemainingAmount(curr), 0);
  }, [udhaariList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return udhaariList.filter((item) => {
      const matchesSearch = item.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const status = deriveStatus(item);
      if (filterType === "Lent") return matchesSearch && item.type === "Lent" && status !== "Settled";
      if (filterType === "Borrowed") return matchesSearch && item.type === "Borrowed" && status !== "Settled";
      if (filterType === "Settled") return matchesSearch && status === "Settled";
      return matchesSearch;
    });
  }, [udhaariList, searchQuery, filterType]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <Header title="Udhaari Tracker" />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-5 max-w-lg mx-auto space-y-5">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  To Receive
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-200">
                {formatCurrency(totalLent)}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/10 border border-amber-200/60 dark:border-amber-800/40 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  To Pay
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-amber-950 dark:text-amber-200">
                {formatCurrency(totalBorrowed)}
              </p>
            </div>
          </div>

          {/* Action Bar & Search */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 shrink-0 ${
                  showForm
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-95"
                }`}
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4" /> Close
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add Record
                  </>
                )}
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {["All", "Lent", "Borrowed", "Settled"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilterType(item)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    filterType === item
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Form Modal / Card */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3.5 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl border border-teal-500/30 dark:border-teal-500/20 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                  {editingId ? "Edit Udhaari Record" : "New Entry"}
                </h2>
                {editingId && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                    Paid: {formatCurrency(editingPaidAmount)}
                  </span>
                )}
              </div>

              {/* Type Segmented Controller */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("Lent")}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    type === "Lent"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Lent (Diye hain)
                </button>
                <button
                  type="button"
                  onClick={() => setType("Borrowed")}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    type === "Borrowed"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Borrowed (Liye hain)
                </button>
              </div>

              {/* Person Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Person Name"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-9 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Note / Description (Optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-xs font-semibold text-white transition-all shadow-sm"
                >
                  {loading ? "Saving..." : editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          )}

          {/* List Section */}
          {filteredList.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900/50 p-10 text-center shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {searchQuery ? "No matching records found" : "No records recorded yet"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Tap "+ Add Record" to start tracking debts and receivables.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => {
                const status = deriveStatus(item);
                const paid = getPaidAmount(item);
                const remaining = getRemainingAmount(item);
                const isSettled = status === "Settled";
                const isLent = item.type === "Lent";
                const progressPercentage = Math.min(100, Math.round((paid / item.amount) * 100));

                return (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border transition-all duration-200 ${
                      isSettled
                        ? "opacity-65 border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left Block */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isLent
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.type}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.personName}
                          </h3>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <span>{formatDate(item.date)}</span>
                          {item.note && (
                            <>
                              <span>•</span>
                              <span className="italic">{item.note}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right Block */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(remaining)}{" "}
                          <span className="text-[10px] font-normal text-slate-400">remaining</span>
                        </p>
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span
                            className={`text-[10px] font-bold ${
                              status === "Half Paid"
                                ? "text-amber-600 dark:text-amber-400"
                                : status === "Settled"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-400"
                            }`}
                          >
                            {status}
                          </span>
                          {paid > 0 && !isSettled && (
                            <span className="text-[10px] text-slate-400">
                              ({progressPercentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Optional Progress Bar for Partial Payments */}
                    {paid > 0 && !isSettled && (
                      <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLent ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                      <div className="text-[11px] text-slate-400 font-medium">
                        Total: {formatCurrency(item.amount)}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isSettled && (
                          <button
                            onClick={() => handleOpenPayment(item.id)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors"
                            title="Record Payment"
                          >
                            <Wallet className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleSettled(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSettled
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                              : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                          title={isSettled ? "Reopen Record" : "Mark Settled"}
                        >
                          {isSettled ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Partial Payment Box */}
                    {paymentOpenId === item.id && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-2 border border-slate-200/80 dark:border-slate-700 animate-in fade-in duration-150">
                        <div className="relative flex-1">
                          <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="number"
                            autoFocus
                            placeholder={`Max ${remaining}`}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-7 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleAddPayment(item)}
                          className="flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>

                        <button
                          onClick={() => setPaymentOpenId(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </PullToRefresh>

      <BottomNav />
    </div>
  );
};

export default Udhaari;