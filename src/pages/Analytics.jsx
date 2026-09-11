import React, { useState, useMemo } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import SpendingChart from "../components/analytics/SpendingChart";
import { useExpenseStore } from "../store/expenseStore";
import { formatCurrency } from "../utils/currencyFormatter";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0f766e",
  "#0284c7",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#10b981",
  "#14b8a6",
  "#64748b",
];

const Analytics = () => {
  const { expenses } = useExpenseStore();
  const [timeframe, setTimeframe] = useState("All");

  // Previously the timeframe buttons updated state but nothing actually
  // filtered the data - all three tabs showed identical charts. Now it
  // actually filters by date.
  const filteredExpenses = useMemo(() => {
    if (timeframe === "All") return expenses;

    const now = new Date();
    return expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      if (isNaN(expDate)) return false;

      if (timeframe === "Weekly") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return expDate >= sevenDaysAgo && expDate <= now;
      }
      if (timeframe === "Monthly") {
        return (
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [expenses, timeframe]);

  const categoryDataMap = filteredExpenses.reduce((acc, curr) => {
    const cat = (curr.category === "Other" ? curr.customCategory : curr.category) || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + Number(curr.amount || 0);
    return acc;
  }, {});

  const pieChartData = Object.keys(categoryDataMap).map((key) => ({
    name: key,
    value: categoryDataMap[key],
  }));

  const paymentDataMap = filteredExpenses.reduce(
    (acc, curr) => {
      if (curr.paymentMode === "Online") acc.Online += Number(curr.amount || 0);
      else acc.Offline += Number(curr.amount || 0);
      return acc;
    },
    { Online: 0, Offline: 0 }
  );

  const barChartData = [
    {
      name: "Payment Modes",
      Online: paymentDataMap.Online,
      Offline: paymentDataMap.Offline,
    },
  ];

  const totalForTimeframe = filteredExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="Analytics" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        {/* Timeframe Selector */}
        <div className="flex gap-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 p-1">
          {["Weekly", "Monthly", "All"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                timeframe === tf
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Total for selected timeframe */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Spent ({timeframe})
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalForTimeframe)}
          </p>
        </div>

        {/* Spending Trend - moved here from Dashboard */}
        <SpendingChart expenses={filteredExpenses} />

        {/* Category Breakdown (Pie Chart) */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
            Category Breakdown
          </h2>
          {pieChartData.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
              No expenses to plot
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Method Comparison (Bar Chart) */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
            Online vs Offline Spend
          </h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
              No data available
            </p>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Online" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Offline" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;