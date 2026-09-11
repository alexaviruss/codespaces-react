import React, { useState, useMemo } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import MonthPicker from "../components/common/MonthPicker";
import { useExpenseStore } from "../store/expenseStore";
import { formatCurrency } from "../utils/currencyFormatter";
import { useBudgetStore } from "../store/budgetStore";
import { Download, TrendingUp, TrendingDown, Printer } from "lucide-react";
import { exportToCSV, exportToJSON, exportToPDF } from "../utils/exportData";
import toast from "react-hot-toast";

const MonthlyReport = () => {
  const { expenses } = useExpenseStore();
  const { monthlyBudget } = useBudgetStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split("T")[0]
  );

  const monthExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    return expenses.filter((exp) => exp.date.startsWith(`${year}-${month}`));
  }, [expenses, selectedMonth]);

  const categoryTotals = useMemo(() => {
    return monthExpenses.reduce((acc, exp) => {
      const category = exp.category === "Other" ? exp.customCategory : exp.category;
      acc[category] = (acc[category] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});
  }, [monthExpenses]);

  const paymentModeTotals = useMemo(() => {
    return monthExpenses.reduce((acc, exp) => {
      acc[exp.paymentMode] = (acc[exp.paymentMode] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});
  }, [monthExpenses]);

  const totalSpent = monthExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );
  const remaining = Math.max(0, monthlyBudget - totalSpent);
  const percentageSpent = ((totalSpent / monthlyBudget) * 100).toFixed(2);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleExport = (format) => {
    try {
      if (format === "csv") {
        exportToCSV(monthExpenses, monthlyBudget);
        toast.success("Exported to CSV!");
      } else if (format === "json") {
        exportToJSON(monthExpenses, monthlyBudget, []);
        toast.success("Exported to JSON!");
      } else if (format === "html") {
        exportToPDF(monthExpenses, monthlyBudget, []);
        toast.success("Opening printable report...");
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Monthly Report" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        {/* Month Picker */}
        <MonthPicker selectedDate={selectedMonth} onDateChange={setSelectedMonth} />

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            JSON
          </button>
          <button
            onClick={() => handleExport("html")}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
            title="Print or save as PDF"
          >
            <Printer size={16} />
            PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              Total Spent
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {percentageSpent}% of budget
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              Remaining
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(remaining)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Out of {formatCurrency(monthlyBudget)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              Transactions
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {monthExpenses.length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Avg {formatCurrency(monthExpenses.length > 0 ? totalSpent / monthExpenses.length : 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              Budget Status
            </p>
            <p
              className={`text-lg font-bold mt-1 ${
                totalSpent > monthlyBudget
                  ? "text-red-600 dark:text-red-400"
                  : totalSpent > monthlyBudget * 0.9
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {totalSpent > monthlyBudget
                ? "Exceeded!"
                : totalSpent > monthlyBudget * 0.9
                ? "Warning"
                : "Safe"}
            </p>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
              Top Categories
            </h3>
            <div className="space-y-3">
              {topCategories.map(([category, amount], idx) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {category}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{
                          width: `${(amount / Math.max(...Object.values(categoryTotals))) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Mode Breakdown */}
        {Object.keys(paymentModeTotals).length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
              Payment Mode Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(paymentModeTotals).map(([mode, amount]) => (
                <div key={mode} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {mode}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {((amount / totalSpent) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {monthExpenses.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No expenses for this month
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MonthlyReport;
