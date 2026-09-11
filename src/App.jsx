import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import AppRoutes from "./routes/AppRoutes";
import FAB from "./components/common/FAB";

// Small wrapper so FAB can check auth state - it needs to live inside
// AuthProvider, and it should only show once the user is logged in
// (otherwise it'd appear on /login and /signup too, linking to a
// protected route they can't access yet).
const GlobalFAB = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <FAB />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <DarkModeProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
            <AppRoutes />
            <GlobalFAB />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
              }}
            />
          </div>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;