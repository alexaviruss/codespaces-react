import React from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { User, Mail, LogOut, Smartphone } from "lucide-react";

const Profile = () => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Header title="My Profile" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xl font-bold mb-3">
            {currentUser?.displayName ? currentUser.displayName.charAt(0) : "U"}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentUser?.displayName || "PaisaTrack User"}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{currentUser?.email}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-700">
            <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Name</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {currentUser?.displayName || "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-700">
            <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Email</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">App Mode</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">PWA / Offline Capable</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;