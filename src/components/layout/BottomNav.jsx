import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, BarChart3, User, FileText } from "lucide-react";

const BottomNav = () => {
  // Floating "Add" button removed - FAB.jsx already provides this,
  // was previously duplicated with a second Plus button.
  const navItems = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Udhaari", path: "/udhaari", icon: Users },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Report", path: "/report", icon: FileText },
    { label: "Profile", path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
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