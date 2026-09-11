import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Auth Pages
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";

// Core App Pages
import Dashboard from "../pages/Dashboard";
import AddExpense from "../pages/AddExpense";
import ExpenseList from "../pages/ExpenseList";
import Udhaari from "../pages/Udhaari";
import Analytics from "../pages/Analytics";
import BudgetSettings from "../pages/BudgetSettings";
import Profile from "../pages/Profile";
import MonthlyReport from "../pages/MonthlyReport";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-expense/:expenseId" element={<AddExpense />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/udhaari" element={<Udhaari />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/report" element={<MonthlyReport />} />
        <Route path="/settings" element={<BudgetSettings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback Redirection */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;