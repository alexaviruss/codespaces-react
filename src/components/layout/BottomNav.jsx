import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Plus, Users, BarChart3, User } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Udhaari", path: "/udhaari", icon: Users },
    { label: "Add", path: "/add-expense", isFloating: true },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Profile", path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg">
      {navItems.map((item) => {
        if (item.isFloating) {
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-xl hover:bg-teal-700 active:scale-95 transition-all"
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
              `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-teal-600 font-semibold"
                  : "text-slate-400 hover:text-slate-600"
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