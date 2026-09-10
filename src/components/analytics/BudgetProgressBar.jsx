import React from "react";
import { formatCurrency } from "../../utils/currencyFormatter";

const BudgetProgressBar = ({ spent, budget }) => {
  const percentage = Math.min(Math.round((spent / (budget || 1)) * 100), 100);

  let barColor = "bg-teal-600";
  let textColor = "text-slate-600";

  if (percentage >= 100) {
    barColor = "bg-red-500";
    textColor = "text-red-600 font-bold";
  } else if (percentage >= 80) {
    barColor = "bg-amber-500";
    textColor = "text-amber-600 font-bold";
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-slate-700">Monthly Budget</span>
        <span className={textColor}>
          {percentage}% Used ({formatCurrency(spent)} / {formatCurrency(budget)})
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetProgressBar;