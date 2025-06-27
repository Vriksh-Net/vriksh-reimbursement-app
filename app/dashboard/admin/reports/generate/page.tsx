"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Filter,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import {
  generateCSVReport,
  generatePDFReport,
  generateExcelReport,
  downloadFile,
  downloadPDF,
  type ExpenseReportData,
} from "@/lib/report-generator";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

interface ReportFilters {
  employee: string;
  department: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  travelOnly: boolean;
  foodOnly: boolean;
  withBills: boolean;
  minAmount: string;
  maxAmount: string;
}

export default function GenerateReportsPage() {
  const [reports, setReports] = useState<ExpenseReportData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    employee: "all",
    department: "all",
    status: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    travelOnly: false,
    foodOnly: false,
    withBills: false,
    minAmount: "",
    maxAmount: "",
  });
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchReports();
    }
  }, [filters, employees]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not properly configured.");
      }

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("users")
        .select("id, full_name, email, department")
        .order("full_name");

      if (employeesError) throw employeesError;

      setEmployees(employeesData || []);

      // Extract unique departments
      const uniqueDepartments = [
        ...new Set(employeesData?.map((emp) => emp.department) || []),
      ];
      setDepartments(uniqueDepartments);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (loading) return;

    try {
      let query = supabase.from("expense_reports").select(`
          id,
          title,
          description,
          amount,
          expense_date,
          status,
          created_at,
          admin_notes,
          is_travel_expense,
          from_location,
          to_location,
          travel_start_date,
          travel_end_date,
          transport_mode,
          accommodation_details,
          business_purpose,
          is_food_expense,
          food_name,
          restaurant_name,
          with_client,
          client_name,
          client_company,
          number_of_attendees,
          meal_type,
          bill_file_url,
          bill_file_name,
          employee:users!user_id (
            full_name,
            email,
            department
          ),
          category:expense_categories!category_id (
            name
          )
        `);

      // Apply filters
      if (filters.employee !== "all") {
        query = query.eq("user_id", filters.employee);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters.dateFrom) {
        query = query.gte("expense_date", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("expense_date", filters.dateTo);
      }

      if (filters.travelOnly) {
        query = query.eq("is_travel_expense", true);
      }

      if (filters.foodOnly) {
        query = query.eq("is_food_expense", true);
      }

      if (filters.withBills) {
        query = query.not("bill_file_url", "is", null);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      let filteredReports = (data || []).map((report) => ({
        ...report,
        employee: Array.isArray(report.employee)
          ? report.employee[0]
          : report.employee,
        category: Array.isArray(report.category)
          ? report.category[0]
          : report.category,
      }));

      // Apply client-side filters for amount range and department
      if (filters.department !== "all") {
        filteredReports = filteredReports.filter(
          (report) => report.employee?.department === filters.department
        );
      }

      if (filters.minAmount) {
        const minAmount = Number.parseFloat(filters.minAmount);
        filteredReports = filteredReports.filter(
          (report) => Number(report.amount) >= minAmount
        );
      }

      if (filters.maxAmount) {
        const maxAmount = Number.parseFloat(filters.maxAmount);
        filteredReports = filteredReports.filter(
          (report) => Number(report.amount) <= maxAmount
        );
      }

      setReports(filteredReports);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (
    key: keyof ReportFilters,
    value: string | boolean
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      employee: "all",
      department: "all",
      status: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
      travelOnly: false,
      foodOnly: false,
      withBills: false,
      minAmount: "",
      maxAmount: "",
    });
  };

  const generateReport = async (format: "csv" | "pdf" | "excel") => {
    if (reports.length === 0) {
      toast({
        title: "No Data",
        description: "No reports match your current filters",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      switch (format) {
        case "csv": {
          const { blob, filename } = generateCSVReport(reports, filters);
          downloadFile(blob, filename);
          break;
        }
        case "pdf": {
          const { doc, filename } = generatePDFReport(reports, filters);
          downloadPDF(doc, filename);
          break;
        }
        case "excel": {
          const { blob, filename } = generateExcelReport(reports, filters);
          downloadFile(blob, filename);
          break;
        }
      }

      toast({
        title: "Success",
        description: `${format.toUpperCase()} report generated successfully`,
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getSelectedEmployeeName = () => {
    if (filters.employee === "all") return "All Employees";
    const employee = employees.find((emp) => emp.id === filters.employee);
    return employee?.full_name || "Unknown Employee";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const calculateSummary = () => {
    const totalAmount = reports.reduce(
      (sum, report) => sum + Number(report.amount),
      0
    );
    const pendingCount = reports.filter(
      (report) => report.status === "pending"
    ).length;
    const approvedCount = reports.filter(
      (report) => report.status === "approved"
    ).length;
    const rejectedCount = reports.filter(
      (report) => report.status === "rejected"
    ).length;
    const travelCount = reports.filter(
      (report) => report.is_travel_expense
    ).length;
    const foodCount = reports.filter((report) => report.is_food_expense).length;
    const withBillsCount = reports.filter(
      (report) => report.bill_file_url
    ).length;

    return {
      totalAmount,
      pendingCount,
      approvedCount,
      rejectedCount,
      travelCount,
      foodCount,
      withBillsCount,
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Generate Reports
          </h1>
          <p className="text-muted-foreground">
            Create comprehensive expense reports with advanced filtering
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {error}
            </p>
            <Button onClick={fetchInitialData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Reports</h1>
        <p className="text-muted-foreground">
          Create comprehensive expense reports with advanced filtering
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure filters to customize your report data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee and Department Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={filters.employee}
                onValueChange={(value) => handleFilterChange("employee", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) =>
                  handleFilterChange("department", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Category Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          {/* Amount Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={filters.minAmount}
                onChange={(e) =>
                  handleFilterChange("minAmount", e.target.value)
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={filters.maxAmount}
                onChange={(e) =>
                  handleFilterChange("maxAmount", e.target.value)
                }
                placeholder="No limit"
              />
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="space-y-3">
            <Label>Additional Filters</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="travelOnly"
                  checked={filters.travelOnly}
                  onCheckedChange={(checked) =>
                    handleFilterChange("travelOnly", checked as boolean)
                  }
                />
                <Label htmlFor="travelOnly" className="text-sm">
                  Travel expenses only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="foodOnly"
                  checked={filters.foodOnly}
                  onCheckedChange={(checked) =>
                    handleFilterChange("foodOnly", checked as boolean)
                  }
                />
                <Label htmlFor="foodOnly" className="text-sm">
                  Food expenses only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="withBills"
                  checked={filters.withBills}
                  onCheckedChange={(checked) =>
                    handleFilterChange("withBills", checked as boolean)
                  }
                />
                <Label htmlFor="withBills" className="text-sm">
                  With bill attachments only
                </Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={fetchReports}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
          <CardDescription>Overview of filtered expense data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{reports.length}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {formatCurrency(summary.totalAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.pendingCount}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.approvedCount}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.rejectedCount}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.travelCount}
              </div>
              <div className="text-sm text-muted-foreground">Travel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {summary.foodCount}
              </div>
              <div className="text-sm text-muted-foreground">Food</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="text-sm">
              <strong>Selected Employee:</strong> {getSelectedEmployeeName()}
            </div>
            {filters.department !== "all" && (
              <div className="text-sm">
                <strong>Department:</strong> {filters.department}
              </div>
            )}
            {filters.dateFrom && (
              <div className="text-sm">
                <strong>Date Range:</strong> {filters.dateFrom} to{" "}
                {filters.dateTo || "Present"}
              </div>
            )}
            <div className="text-sm">
              <strong>Reports with Bills:</strong> {summary.withBillsCount} of{" "}
              {reports.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Download Reports
          </CardTitle>
          <CardDescription>
            Generate and download comprehensive expense reports in various
            formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => generateReport("csv")}
              disabled={generating || reports.length === 0}
              className="h-20 flex-col"
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Download CSV</span>
              <span className="text-xs opacity-75">Spreadsheet format</span>
            </Button>

            <Button
              onClick={() => generateReport("excel")}
              disabled={generating || reports.length === 0}
              className="h-20 flex-col"
              variant="outline"
            >
              <FileSpreadsheet className="h-8 w-8 mb-2" />
              <span>Download Excel</span>
              <span className="text-xs opacity-75">
                Enhanced CSV with summary
              </span>
            </Button>

            <Button
              onClick={() => generateReport("pdf")}
              disabled={generating || reports.length === 0}
              className="h-20 flex-col"
              variant="outline"
            >
              <FileImage className="h-8 w-8 mb-2" />
              <span>Download PDF</span>
              <span className="text-xs opacity-75">Formatted report</span>
            </Button>
          </div>

          {reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports match your current filters.</p>
              <p className="text-sm">
                Adjust your filters to see available data.
              </p>
            </div>
          )}

          {generating && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Generating report...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
