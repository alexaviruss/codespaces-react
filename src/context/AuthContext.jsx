import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
  googleProvider,
} from "../services/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create / Sync User Profile
  const syncUserProfile = async (user) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          profile: {
            name: user.displayName || "User",
            email: user.email || "",
            monthlyBudget: 10000,
            currency: "INR",
            createdAt: serverTimestamp(),
          },
        });

        console.log("User profile created");
      }
    } catch (error) {
      console.error("Profile Sync Error:", error);
      throw error;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      const user = result.user;

      await syncUserProfile(user);

      console.log("Google Login Successful:", user.email);

      return user;

    } catch (error) {
      console.error("Google Sign In Error:", error);

      if (error.code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain is not authorized for Google Sign-In. Add your domain in Firebase Console > Authentication > Settings > Authorized domains."
        );
      }

      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Google Sign-In popup was closed.");
      }

      if (error.code === "auth/popup-blocked") {
        throw new Error(
          "Google Sign-In popup was blocked by your browser."
        );
      }

      if (error.code === "auth/cancelled-popup-request") {
        throw new Error(
          "Another Google Sign-In request is already in progress."
        );
      }

      throw error;
    }
  };

  // Check Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (user) {
            await syncUserProfile(user);
            setCurrentUser(user);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error(
            "Authentication State Error:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};