import React from "react";
import { formatCurrency } from "../../utils/currencyFormatter";

const SummaryCard = ({ title, amount, icon: Icon, colorClass, subtitle }) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-xl font-bold text-slate-900">
          {formatCurrency(amount)}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;