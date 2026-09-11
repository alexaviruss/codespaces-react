import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Plus, Users, BarChart3, User, FileText } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Udhaari", path: "/udhaari", icon: Users },
    { label: "Add", path: "/add-expense", isFloating: true },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Report", path: "/report", icon: FileText },
    { label: "Profile", path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 shadow-lg">
      {navItems.map((item) => {
        if (item.isFloating) {
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl active:scale-95 transition-all"
            >
              <Plus className="h-7 w-7" />
            </button>
          );
        }

        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors px-1 ${
                isActive
                  ? "text-teal-600 dark:text-teal-400 font-semibold"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;