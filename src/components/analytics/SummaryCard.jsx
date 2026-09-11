import React from "react";
import { formatCurrency } from "../../utils/currencyFormatter";

const SummaryCard = ({ title, amount, icon: Icon, colorClass, subtitle, isCurrency = true }) => {
  const displayValue = isCurrency
    ? formatCurrency(amount)
    : Number(amount || 0).toLocaleString("en-IN");

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {displayValue}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;