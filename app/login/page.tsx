"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const ADMIN_EMAIL = "admin23@vrikshconsulting.com";
const ADMIN_PASSWORD = "Vrikshj@1934";
const ADMIN_ID = "00000000-0000-0000-0000-000000000001"; // Fixed valid UUID



const Login = () => {
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUserRole, setUserProfile } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmployeeLogin) {
      // Employee login
      try {
        const response = await fetch("/api/employee/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole("employee");
          setUserProfile(data); // <-- set the full user profile here
          toast({
            title: "Login successful",
            description: "Welcome, Employee!",
          });
          router.push("/dashboard");
        } else {
          toast({
            title: "Login failed",
            description: "Invalid credentials",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
    } else {
      // Admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setUserRole("admin");
        setUserProfile({
          id: ADMIN_ID, // Use the fixed valid UUID
          email: ADMIN_EMAIL,
          full_name: "Admin",
          role: "admin",
          department: "Admin",
          can_approve_accounts: false,
          can_approve_manager: false,
          can_handle_fund_transfer: false
        });
        toast({ title: "Login successful", description: "Welcome, Admin!" });
        router.push("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid admin credentials",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        className="space-y-4 w-full max-w-sm bg-white p-8 rounded-lg shadow-lg"
        onSubmit={handleLogin}
      >
        <h1 className="text-2xl font-bold mb-4 flex items-center justify-center text-green-600">
          {isEmployeeLogin ? "Employee Login" : "Admin Login"}
        </h1>
        <input
          type="text"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded-md w-80 border-gray-300 outline-none placeholder:text-sm"
        />
        <input
          type="text"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 border p-2 rounded-md w-80 border-gray-300 outline-none placeholder:text-sm"
        />
        <Button
          type="submit"
          className="mt-4 w-full bg-teal-200 text-gray-600 text-lg flex p-4 hover:bg-green-400 cursor-pointer"
        >
          Login
        </Button>
        <p className="text-sm text-gray-400 w-full text-center rounded-md">
          {isEmployeeLogin ? (
            <a href="#" onClick={() => setIsEmployeeLogin(false)}>
              Admin Login
            </a>
          ) : (
            <a href="#" onClick={() => setIsEmployeeLogin(true)}>
              Employee Login
            </a>
          )}
        </p>
      </form>
    </div>
  );
};

export default Login;
