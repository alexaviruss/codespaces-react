import toast from "react-hot-toast";

export const checkBudgetAlert = (totalSpent, monthlyBudget) => {
  const spentPercentage = (totalSpent / monthlyBudget) * 100;

  if (spentPercentage >= 100) {
    toast.error(`⚠️ Budget Exceeded! You've spent ₹${Math.round(totalSpent)} out of ₹${monthlyBudget}`, {
      duration: 4000,
    });
  } else if (spentPercentage >= 90) {
    toast(
      `⚠️ Warning: You've spent 90% of your budget! Only ₹${Math.round(monthlyBudget - totalSpent)} left`,
      {
        icon: "🚨",
        duration: 4000,
      }
    );
  } else if (spentPercentage >= 70) {
    toast(`💡 Tip: You've spent 70% of your budget. Keep an eye on spending!`, {
      duration: 3000,
    });
  }
};

export const getBudgetStatus = (totalSpent, monthlyBudget) => {
  const spentPercentage = (totalSpent / monthlyBudget) * 100;

  if (spentPercentage >= 100) {
    return { status: "exceeded", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20" };
  } else if (spentPercentage >= 90) {
    return { status: "warning", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20" };
  } else {
    return { status: "safe", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" };
  }
};
