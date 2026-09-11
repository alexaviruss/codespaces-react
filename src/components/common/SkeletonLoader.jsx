import React from "react";

// Skeleton Card Component
export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-slate-200 rounded-2xl p-4 animate-pulse ${className}`}>
    <div className="h-4 bg-slate-300 rounded w-1/3 mb-3"></div>
    <div className="h-6 bg-slate-300 rounded w-1/2"></div>
  </div>
);

// Skeleton Text Component
export const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-slate-200 rounded animate-pulse mb-2"
        style={{
          width: i === lines - 1 ? "70%" : "100%",
          marginBottom: i === lines - 1 ? "0" : "8px",
        }}
      ></div>
    ))}
  </div>
);

// Skeleton Expense List Item
export const SkeletonExpenseItem = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse mb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-5 bg-slate-200 rounded w-16"></div>
    </div>
  </div>
);

// Skeleton Dashboard Summary Cards
export const SkeletonSummaryCards = () => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <SkeletonCard key={i} className="h-28" />
    ))}
  </div>
);

// Skeleton Budget Bar
export const SkeletonBudgetBar = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse mb-6">
    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
    <div className="h-6 bg-slate-200 rounded-full w-full"></div>
  </div>
);

// Full Dashboard Skeleton
export const DashboardSkeleton = () => (
  <div className="px-4 py-4 max-w-md mx-auto">
    <SkeletonBudgetBar />
    <SkeletonSummaryCards />
    <div className="mb-4">
      <div className="h-5 bg-slate-200 rounded animate-pulse w-1/3 mb-3"></div>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonExpenseItem key={i} />
      ))}
    </div>
  </div>
);

// Analytics Page Skeleton
export const AnalyticsSkeleton = () => (
  <div className="px-4 py-4 max-w-md mx-auto">
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse mb-4 h-64"></div>
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse h-64"></div>
  </div>
);

// Expense List Skeleton
export const ExpenseListSkeleton = () => (
  <div className="px-4 py-4 max-w-md mx-auto">
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonExpenseItem key={i} />
    ))}
  </div>
);
