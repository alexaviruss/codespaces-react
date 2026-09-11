import React, { useState, useCallback } from "react";
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
  ArrowUpRight, ArrowDownLeft, CheckCircle, RotateCcw, Trash2, Plus,
  User, Calendar, FileText, IndianRupee, Wallet, Edit2, X,
} from "lucide-react";

const Udhaari = () => {
  const { currentUser } = useAuth();
  const { udhaariList } = useUdhaariStore();

  const [type, setType] = useState("Lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingPaidAmount, setEditingPaidAmount] = useState(0);

  // Inline "record a payment" state
  const [paymentOpenId, setPaymentOpenId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Data refreshed!", { duration: 2000 });
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
      toast.error("Please provide a valid person name and amount");
      return;
    }

    if (editingId && Number(amount) < editingPaidAmount) {
      toast.error(
        `New amount can't be less than what's already paid (${formatCurrency(editingPaidAmount)})`
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
        toast.success("Udhaari record updated!");
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
        toast.success("Udhaari record added!");
      }

      resetForm();
    } catch (error) {
      toast.error(editingId ? "Failed to update record" : "Failed to add Udhaari record");
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
      toast.error(`Payment can't exceed the remaining ${formatCurrency(remaining)}`);
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
      toast.success(isSettled ? "Reopened" : "Marked as Settled");
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

  const totalLent = udhaariList
    .filter((i) => i.type === "Lent" && deriveStatus(i) !== "Settled")
    .reduce((acc, curr) => acc + getRemainingAmount(curr), 0);

  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && deriveStatus(i) !== "Settled")
    .reduce((acc, curr) => acc + getRemainingAmount(curr), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Udhaari Tracker" />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-4 max-w-md mx-auto space-y-4">
          {/* Total Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-700 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase">
                <ArrowUpRight className="h-4 w-4" /> To Receive
              </div>
              <p className="mt-2 text-xl font-bold text-emerald-900 dark:text-emerald-300">
                {formatCurrency(totalLent)}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase">
                <ArrowDownLeft className="h-4 w-4" /> To Pay
              </div>
              <p className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-300">
                {formatCurrency(totalBorrowed)}
              </p>
            </div>
          </div>

          {/* Toggle Form Button */}
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Add Udhaari Record"}
          </button>

          {/* Form Drawer / Container */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              {editingId && (
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  Editing record — payment history is kept as-is.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("Lent")}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    type === "Lent"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Lent (Diye hain)
                </button>
                <button
                  type="button"
                  onClick={() => setType("Borrowed")}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    type === "Borrowed"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Borrowed (Liye hain)
                </button>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Person Name"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 dark:focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 dark:focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2 pl-9 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-600 dark:focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Note (Optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 dark:focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 py-2.5 text-xs font-semibold text-white transition-all"
              >
                {loading ? "Saving..." : editingId ? "Update Record" : "Save Record"}
              </button>
            </form>
          )}

          {/* List of Udhaari Items */}
          {udhaariList.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-400 dark:text-slate-500">No lending or borrowing records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {udhaariList.map((item) => {
                const status = deriveStatus(item);
                const paid = getPaidAmount(item);
                const remaining = getRemainingAmount(item);
                const isSettled = status === "Settled";

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border transition-all ${
                      isSettled ? "opacity-60 border-slate-100 dark:border-slate-700" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              item.type === "Lent"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {item.type}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">{item.personName}</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(item.date)} {item.note ? `• ${item.note}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(remaining)} <span className="font-normal text-slate-400 dark:text-slate-500 text-xs">left</span>
                          </p>
                          <p className={`text-[10px] font-semibold ${
                            status === "Half Paid" ? "text-amber-600 dark:text-amber-400" :
                            status === "Settled" ? "text-emerald-600 dark:text-emerald-400" :
                            "text-slate-400 dark:text-slate-500"
                          }`}>
                            {status}{paid > 0 && !isSettled ? ` • paid ${formatCurrency(paid)}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-50 dark:border-slate-700 pt-2">
                      {!isSettled && (
                        <button
                          onClick={() => handleOpenPayment(item.id)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                          title="Record a Payment"
                        >
                          <Wallet className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleToggleSettled(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSettled
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                            : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        title={isSettled ? "Reopen" : "Mark as Settled"}
                      >
                        {isSettled ? <RotateCcw className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {paymentOpenId === item.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700 p-2">
                        <div className="relative flex-1">
                          <IndianRupee className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <input
                            type="number"
                            autoFocus
                            placeholder={`Up to ${remaining}`}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-1.5 pl-7 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleAddPayment(item)}
                          className="rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setPaymentOpenId(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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