import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatCurrency } from "../../utils/currencyFormatter";

const SpendingChart = ({ expenses = [] }) => {
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by date
    const grouped = {};
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const dateKey = expenseDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = 0;
      }
      grouped[dateKey] += Number(expense.amount || 0);
    });

    // Sort by date and get last 7 days
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
      .slice(-7);
  }, [expenses]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-center">
        <p className="text-slate-500 dark:text-slate-400">No spending data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">7-Day Spending Trend</h3>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `₹${value / 1000}k`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          <Bar 
            dataKey="amount" 
            fill="#14b8a6" 
            radius={[8, 8, 0, 0]}
            name="Spent"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Total spending (7 days): <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.amount, 0))}
          </span>
        </p>
      </div>
    </div>
  );
};

export default SpendingChart;
