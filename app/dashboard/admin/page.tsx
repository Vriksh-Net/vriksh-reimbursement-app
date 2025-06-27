"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userProfile && userProfile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [userProfile, router]);

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  if (userProfile.role !== "admin") {
    return <div>Access denied. Admins only.</div>;
  }

  // ...existing admin dashboard code...
}