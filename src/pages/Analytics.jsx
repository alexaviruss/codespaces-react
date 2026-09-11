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
import { Calendar, PieChart as PieIcon, CreditCard, TrendingUp } from "lucide-react";

const COLORS = [
  "#0d9488", // Teal 600
  "#0284c7", // Sky 600
  "#6366f1", // Indigo 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#f43f5e", // Rose 500
  "#f97316", // Orange 500
  "#eab308", // Yellow 500
  "#10b981", // Emerald 500
  "#06b6d4", // Cyan 500
  "#64748b", // Slate 500
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-slate-900/90 dark:bg-slate-800/95 p-2.5 shadow-lg border border-slate-700 backdrop-blur-md text-xs text-white space-y-1">
        <p className="font-bold text-slate-200">{payload[0].name || payload[0].dataKey}</p>
        <p className="font-black text-teal-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { expenses } = useExpenseStore();
  const [timeframe, setTimeframe] = useState("All");

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

  const categoryDataMap = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => {
      const cat = (curr.category === "Other" ? curr.customCategory : curr.category) || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + Number(curr.amount || 0);
      return acc;
    }, {});
  }, [filteredExpenses]);

  const pieChartData = useMemo(() => {
    return Object.keys(categoryDataMap)
      .map((key) => ({
        name: key,
        value: categoryDataMap[key],
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryDataMap]);

  const paymentDataMap = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, curr) => {
        if (curr.paymentMode === "Online") acc.Online += Number(curr.amount || 0);
        else acc.Offline += Number(curr.amount || 0);
        return acc;
      },
      { Online: 0, Offline: 0 }
    );
  }, [filteredExpenses]);

  const barChartData = [
    {
      name: "Payment Modes",
      Online: paymentDataMap.Online,
      Offline: paymentDataMap.Offline,
    },
  ];

  const totalForTimeframe = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <Header title="Analytics" />

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Timeframe Selector Pill Group */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          {["Weekly", "Monthly", "All"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-xl py-2 text-xs font-bold transition-all ${
                timeframe === tf
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Total Spent Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 p-4.5 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Total Spent ({timeframe})
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalForTimeframe)}
          </p>
        </div>

        {/* Spending Trend Line Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <SpendingChart expenses={filteredExpenses} />
        </div>

        {/* Category Breakdown (Pie Chart + Detailed List) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4.5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <PieIcon className="h-4 w-4 text-teal-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category Breakdown
            </h2>
          </div>

          {pieChartData.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
              No expenses available for this period.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Itemized Category Breakdown */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {pieChartData.map((item, index) => {
                  const percentage = Math.round((item.value / (totalForTimeframe || 1)) * 100);
                  const color = COLORS[index % COLORS.length];

                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Online vs Offline Bar Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4.5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <CreditCard className="h-4 w-4 text-teal-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Online vs Offline Spend
            </h2>
          </div>

          {filteredExpenses.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
              No payment mode data available.
            </p>
          ) : (
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} barGap={12}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    iconType="circle"
                  />
                  <Bar dataKey="Online" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="Offline" fill="#f97316" radius={[6, 6, 0, 0]} barSize={32} />
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