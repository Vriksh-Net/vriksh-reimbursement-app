"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plane,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnalyticsSkeleton } from "@/components/skeletons/analytics-skeleton";

interface AnalyticsData {
  totalExpenses: number;
  pendingReports: number;
  approvedReports: number;
  totalAmount: number;
  travelExpenses: number;
  foodExpenses: number;
  categoryData: Array<{ name: string; amount: number; count: number }>;
  monthlyData: Array<{ month: string; amount: number; count: number }>;
  departmentData: Array<{ department: string; amount: number; count: number }>;
  statusData: Array<{ status: string; count: number }>;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not properly configured. Please check your environment variables."
        );
      }

      console.log("Fetching analytics data from Supabase...");

      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from("expense_reports")
        .select("count", { count: "exact", head: true });

      if (testError) {
        console.error("Supabase connection test failed:", testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log("Connection test successful, fetching analytics data...");

      // Fetch expense reports with related data using explicit relationship naming
      const { data: reports, error } = await supabase.from("expense_reports")
        .select(`
          id,
          amount,
          expense_date,
          status,
          created_at,
          is_travel_expense,
          is_food_expense,
          category:expense_categories!category_id (
            name
          ),
          employee:users!user_id (
            department
          )
        `);

      if (error) {
        console.error("Error fetching reports:", error);
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      console.log(
        "Successfully fetched analytics data:",
        reports?.length || 0,
        "reports"
      );

      if (!reports || reports.length === 0) {
        // Set empty analytics data
        setData({
          totalExpenses: 0,
          pendingReports: 0,
          approvedReports: 0,
          totalAmount: 0,
          travelExpenses: 0,
          foodExpenses: 0,
          categoryData: [],
          monthlyData: [],
          departmentData: [],
          statusData: [],
        });
        return;
      }

      // Calculate analytics
      const totalExpenses = reports.length;
      const pendingReports = reports.filter(
        (r) => r.status === "pending"
      ).length;
      const approvedReports = reports.filter(
        (r) => r.status === "approved"
      ).length;
      const totalAmount = reports.reduce(
        (sum, r) => sum + Number.parseFloat(r.amount.toString()),
        0
      );
      const travelExpenses = reports.filter((r) => r.is_travel_expense).length;
      const foodExpenses = reports.filter((r) => r.is_food_expense).length;

      // Category breakdown
      const categoryMap = new Map();
      reports.forEach((report) => {
        const categoryArr = report.category as
          | Array<{ name: string }>
          | undefined;
        const categoryObj = report.category as unknown as
          | { name: string }
          | undefined;
        const categoryName = Array.isArray(categoryArr)
          ? categoryArr[0]?.name || "Other"
          : categoryObj?.name || "Other";
        const existing = categoryMap.get(categoryName) || {
          amount: 0,
          count: 0,
        };
        categoryMap.set(categoryName, {
          amount: existing.amount + Number.parseFloat(report.amount.toString()),
          count: existing.count + 1,
        });
      });
      const categoryData = Array.from(categoryMap.entries()).map(
        ([name, data]) => ({
          name,
          ...data,
        })
      );

      // Monthly breakdown (last 6 months)
      const monthlyMap = new Map();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7); // YYYY-MM format
      }).reverse();

      last6Months.forEach((month) => {
        monthlyMap.set(month, { amount: 0, count: 0 });
      });

      reports.forEach((report) => {
        const month = report.expense_date.slice(0, 7);
        if (monthlyMap.has(month)) {
          const existing = monthlyMap.get(month);
          monthlyMap.set(month, {
            amount:
              existing.amount + Number.parseFloat(report.amount.toString()),
            count: existing.count + 1,
          });
        }
      });

      const monthlyData = Array.from(monthlyMap.entries()).map(
        ([month, data]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          ...data,
        })
      );

      // Department breakdown
      const departmentMap = new Map();
      reports.forEach((report) => {
        const employeeArr = report.employee as
          | Array<{ department: string }>
          | undefined;
        const employeeObj = report.employee as unknown as
          | { department: string }
          | undefined;
        const department = Array.isArray(employeeArr)
          ? employeeArr[0]?.department || "Unknown"
          : employeeObj?.department || "Unknown";
        const existing = departmentMap.get(department) || {
          amount: 0,
          count: 0,
        };
        departmentMap.set(department, {
          amount: existing.amount + Number.parseFloat(report.amount.toString()),
          count: existing.count + 1,
        });
      });
      const departmentData = Array.from(departmentMap.entries()).map(
        ([department, data]) => ({
          department,
          ...data,
        })
      );

      // Status breakdown
      const statusMap = new Map();
      reports.forEach((report) => {
        const status = report.status;
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });
      const statusData = Array.from(statusMap.entries()).map(
        ([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
        })
      );

      setData({
        totalExpenses,
        pendingReports,
        approvedReports,
        totalAmount,
        travelExpenses,
        foodExpenses,
        categoryData,
        monthlyData,
        departmentData,
        statusData,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      setError(error.message || "An unknown error occurred");
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics data",
        variant: "destructive",
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

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of expense reports and spending patterns
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {error}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Please check:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Supabase environment variables are set correctly</li>
                <li>Database tables exist and have proper structure</li>
                <li>Network connection is stable</li>
              </ul>
            </div>
            <Button onClick={fetchAnalyticsData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of expense reports and spending patterns
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalyticsData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalExpenses}</div>
            <p className="text-xs text-muted-foreground">
              All time expense reports
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reports
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Reports
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.approvedReports}</div>
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
              {formatCurrency(data.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">All expense reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Travel Expenses
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.travelExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Travel-related reports
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Expenses</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.foodExpenses}</div>
            <p className="text-xs text-muted-foreground">Food/meal reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {data.categoryData.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>
                Distribution of expenses across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {data.categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Trends</CardTitle>
              <CardDescription>
                Expense amounts over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-amount)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Report Status Distribution</CardTitle>
              <CardDescription>
                Current status of all expense reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) =>
                        `${status} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center">
              No expense reports have been submitted yet. Charts will appear
              once data is available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
