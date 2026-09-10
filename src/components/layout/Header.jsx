import React from "react";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/firebase";
import { Wallet, LogOut, Settings, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Header = ({ title }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {title || "PaisaTrack"}
          </h1>
          {currentUser && (
            <p className="text-xs text-slate-500">
              Hi, {currentUser.displayName || "User"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/settings"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          title="Budget Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Link
          to="/profile"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          title="Profile"
        >
          <User className="h-5 w-5" />
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-xl p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;