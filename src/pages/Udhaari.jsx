import React, { useState } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useUdhaariStore } from "../store/udhaariStore";
import { db } from "../services/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate, getCurrentDate } from "../utils/dateHelpers";
import toast from "react-hot-toast";
import { ArrowUpRight, ArrowDownLeft, CheckCircle, Trash2, Plus, User, Calendar, FileText, IndianRupee, Split } from "lucide-react";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim() || !amount || Number(amount) <= 0) {
      toast.error("Please provide a valid person name and amount");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "users", currentUser.uid, "udhaari"), {
        type,
        personName: personName.trim(),
        amount: Number(amount),
        date,
        note: note.trim(),
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      toast.success("Udhaari record added!");
      setPersonName("");
      setAmount("");
      setNote("");
      setShowForm(false);
    } catch (error) {
      toast.error("Failed to add Udhaari record");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    // Cycle: Pending → Half Paid → Settled → Pending
    let newStatus = "Pending";
    if (currentStatus === "Pending") {
      newStatus = "Half Paid";
    } else if (currentStatus === "Half Paid") {
      newStatus = "Settled";
    }
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "udhaari", id), {
        status: newStatus,
      });
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleHalfPaid = async (id) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "udhaari", id), {
        status: "Half Paid",
      });
      toast.success("Marked as Half Paid");
    } catch (error) {
      toast.error("Failed to mark as half paid");
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
    .filter((i) => i.type === "Lent" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const halfPaidLent = udhaariList
    .filter((i) => i.type === "Lent" && i.status === "Half Paid")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const halfPaidBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Half Paid")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Udhaari Tracker" />

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
            {halfPaidLent > 0 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Half Paid: {formatCurrency(halfPaidLent)}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase">
              <ArrowDownLeft className="h-4 w-4" /> To Pay
            </div>
            <p className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-300">
              {formatCurrency(totalBorrowed)}
            </p>
            {halfPaidBorrowed > 0 && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                Half Paid: {formatCurrency(halfPaidBorrowed)}
              </p>
            )}
          </div>
        </div>

        {/* Toggle Form Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Udhaari Record"}
        </button>

        {/* Form Drawer / Container */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("Lent")}
                className={`rounded-xl py-2 text-xs font-bold transition-all ${
                  type === "Lent"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600"
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
                    : "bg-slate-100 text-slate-600"
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
              {loading ? "Saving..." : "Save Record"}
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
            {udhaariList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border transition-all ${
                  item.status === "Settled" ? "opacity-50 border-slate-100 dark:border-slate-700" : "border-slate-200 dark:border-slate-700"
                }`}
              >
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

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className={`text-[10px] font-semibold ${
                      item.status === "Half Paid" ? "text-amber-600 dark:text-amber-400" :
                      item.status === "Settled" ? "text-emerald-600 dark:text-emerald-400" :
                      "text-slate-400 dark:text-slate-500"
                    }`}>
                      {item.status}
                    </p>
                  </div>

                  {item.status !== "Settled" && (
                    <button
                      onClick={() => handleHalfPaid(item.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      title="Mark as Half Paid"
                    >
                      <Split className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStatus(item.id, item.status)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.status === "Settled"
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    title={item.status === "Settled" ? "Mark as Pending" : "Mark as Settled"}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

export default Udhaari;