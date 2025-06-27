"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, FileText, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  totalAmount: number;
  recentReports: Array<{
    id: string;
    title: string;
    amount: number;
    status: string;
    created_at: string;
    expense_categories: { name: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;

    try {
      let query = supabase.from("expense_reports").select(`
          *,
          expense_categories (name)
        `);

      // If not admin, filter by user
      if (userProfile.role !== "admin") {
        query = query.eq("user_id", userProfile.id);
      }

      const { data: reports, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      const totalReports = reports?.length || 0;
      const pendingReports =
        reports?.filter((r) => r.status === "pending").length || 0;
      const approvedReports =
        reports?.filter((r) => r.status === "approved").length || 0;
      const totalAmount =
        reports?.reduce((sum, r) => sum + Number.parseFloat(r.amount), 0) || 0;
      const recentReports = reports?.slice(0, 5) || [];

      setStats({
        totalReports,
        pendingReports,
        approvedReports,
        totalAmount,
        recentReports,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty stats on error
      setStats({
        totalReports: 0,
        pendingReports: 0,
        approvedReports: 0,
        totalAmount: 0,
        recentReports: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

   if (loading || !stats) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userProfile?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your expense reports
          </p>
        </div>
        {userProfile?.role === "employee" && (
          <Button asChild>
            <Link href="/dashboard/submit">
              <Plus className="mr-2 h-4 w-4" />
              Submit Expense
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.role === "admin"
                ? "All expense reports"
                : "Your expense reports"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedReports}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.role === "admin"
                ? "All expenses"
                : "Your total expenses"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expense Reports</CardTitle>
          <CardDescription>
            {userProfile?.role === "admin"
              ? "Latest submissions from all employees"
              : "Your recent expense submissions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">
                {userProfile?.role === "admin"
                  ? "No expense reports have been submitted yet."
                  : "You haven't submitted any expense reports yet."}
              </p>
              {userProfile?.role === "employee" && (
                <Button asChild>
                  <Link href="/dashboard/submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Your First Expense
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.expense_categories.name} •{" "}
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {formatCurrency(report.amount)}
                    </span>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status.charAt(0).toUpperCase() +
                        report.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Button variant="outline" asChild>
                  <Link
                    href={
                      userProfile?.role === "admin"
                        ? "/dashboard/admin/reports"
                        : "/dashboard/reports"
                    }
                  >
                    View All Reports
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
