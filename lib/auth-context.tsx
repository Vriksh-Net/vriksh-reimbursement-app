"use client";

import type React from "react";
import { useEffect } from "react";

import { createContext, useContext, useState } from "react";

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  setUserRole: (role: "employee" | "admin") => void;
  setUserProfile: (profile: UserProfile | null) => void; // FIXED: allow null
}

interface UserProfile {
  can_approve_accounts: boolean;
  can_approve_manager: boolean;
  can_handle_fund_transfer: boolean;
  id: string;
  email: string;
  full_name: string;
  role: "employee" | "admin";
  department: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      setUserProfile(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // Save user to localStorage on change
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
    } else {
      localStorage.removeItem("userProfile");
    }
  }, [userProfile]);

  const setUserRole = (role: "employee" | "admin") => {
    setUserProfile((prev) => (prev ? { ...prev, role } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        setUserRole,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
