import React from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const FAB = () => {
  return (
    <Link
      to="/add-expense"
      className="fixed bottom-24 right-4 w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-40"
      title="Quick Add Expense"
    >
      <Plus size={28} strokeWidth={2.5} />
    </Link>
  );
};

export default FAB;
