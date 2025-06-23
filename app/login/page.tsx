"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";

const Login = () => {
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form className="space-y-4 w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 flex items-center justify-center text-green-600">
          {isEmployeeLogin ? "Employee Login" : "Admin Login"}
        </h1>
        <input
          type="text"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded-md w-80 border-gray-300 outline-none"
        />
        <input
          type="text"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 border p-2 rounded-md w-80 border-gray-300 outline-none"
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
