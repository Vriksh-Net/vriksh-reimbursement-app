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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  DollarSign,
  Eye,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  Plane,
  MapPin,
  ExternalLink,
  UtensilsCrossed,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";

interface ExpenseReport {
  id: string;
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_notes?: string;
  user_id: string;
  category_id: string;
  is_travel_expense: boolean;
  from_location?: string;
  to_location?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  transport_mode?: string;
  accommodation_details?: string;
  business_purpose?: string;
  is_food_expense: boolean;
  food_name?: string;
  restaurant_name?: string;
  with_client?: boolean;
  client_name?: string;
  client_company?: string;
  number_of_attendees?: number;
  meal_type?: string;
  bill_file_url?: string;
  bill_file_name?: string;
  employee: {
    full_name: string;
    email: string;
    department: string;
  };
  category: {
    name: string;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    dateFrom: "",
    dateTo: "",
    travelOnly: false,
    foodOnly: false,
  });
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not properly configured. Please check your environment variables."
        );
      }

      console.log("Fetching reports from Supabase...");

      const { data: testData, error: testError } = await supabase
        .from("expense_reports")
        .select("count", { count: "exact", head: true });

      if (testError) {
        console.error("Supabase connection test failed:", testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log("Connection test successful, fetching full data...");

      const { data, error } = await supabase
        .from("expense_reports")
        .select(
          `
          id,
          title,
          description,
          amount,
          expense_date,
          status,
          created_at,
          admin_notes,
          user_id,
          category_id,
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
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      console.log("Successfully fetched reports:", data?.length || 0);
      setReports(
        (data || []).map((report: any) => ({
          ...report,
          employee: Array.isArray(report.employee)
            ? report.employee[0]
            : report.employee,
          category: Array.isArray(report.category)
            ? report.category[0]
            : report.category,
        }))
      );
    } catch (error: any) {
      console.error("Error in fetchReports:", error);
      setError(error.message || "An unknown error occurred");
      toast({
        title: "Error",
        description: error.message || "Failed to load expense reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.status !== "all") {
      filtered = filtered.filter((report) => report.status === filters.status);
    }

    if (filters.department !== "all") {
      filtered = filtered.filter(
        (report) => report.employee.department === filters.department
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (report) => report.expense_date >= filters.dateFrom
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (report) => report.expense_date <= filters.dateTo
      );
    }

    if (filters.travelOnly) {
      filtered = filtered.filter((report) => report.is_travel_expense);
    }

    if (filters.foodOnly) {
      filtered = filtered.filter((report) => report.is_food_expense);
    }

    setFilteredReports(filtered);
  };

  const handleStatusUpdate = async (
    reportId: string,
    newStatus: "approved" | "rejected"
  ) => {
    if (!userProfile) return;

    try {
      // Determine the new stage based on status
      const newStage = newStatus === "approved" ? "approved" : "rejected";

      const { error } = await supabase
        .from("expense_reports")
        .update({
          status: newStatus,
          current_stage: newStage, // <-- update current_stage
          admin_notes: adminNotes,
          approved_by: "00000000-0000-0000-0000-000000000001",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      // Ensure workflow step for "approved" is marked as completed
      if (newStatus === "approved") {
        await supabase.from("expense_workflow").upsert(
          [
            {
              expense_report_id: reportId,
              stage: "approved",
              approved_by: userProfile.id,
              approved_at: new Date().toISOString(),
              notes: adminNotes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "expense_report_id,stage" }
        );
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Expense report ${newStatus} successfully`,
      });

      const updatedReports = reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: newStatus,
              current_stage: newStage, // <-- update local state
              admin_notes: adminNotes,
            }
          : report
      );
      setReports(updatedReports);

      setDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update expense report",
        variant: "destructive",
      });
    }
  };
  const handleFundTransfer = async (reportId: string) => {
    if (!userProfile) return;
    await supabase.from("expense_workflow").upsert(
      [
        {
          expense_report_id: reportId,
          stage: "fund_transfer",
          approved_by: userProfile.id,
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "expense_report_id,stage" }
    );
    // Refresh reports or workflow data
    fetchReports();
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Employee",
        "Department",
        "Title",
        "Category",
        "Amount",
        "Date",
        "Status",
        "Travel",
        "From",
        "To",
        "Transport",
        "Submitted",
      ],
      ...filteredReports.map((report) => [
        report.employee.full_name,
        report.employee.department,
        report.title,
        report.category.name,
        report.amount,
        report.expense_date,
        report.status,
        report.is_travel_expense ? "Yes" : "No",
        report.from_location || "",
        report.to_location || "",
        report.transport_mode || "",
        new Date(report.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const uniqueDepartments = [
    ...new Set(
      reports.map((r) => r.employee?.department).filter((dept) => dept != null)
    ),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading expense reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            All Expense Reports
          </h1>
          <p className="text-muted-foreground">
            Review and manage employee expense reports
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {error}
            </p>
            <Button onClick={fetchReports} className="mt-4">
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            All Expense Reports
          </h1>
          <p className="text-muted-foreground">
            Review and manage employee expense reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={filteredReports.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
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
              <Label>Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={
                  filters.travelOnly
                    ? "travel"
                    : filters.foodOnly
                    ? "food"
                    : "all"
                }
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    travelOnly: value === "travel",
                    foodOnly: value === "food",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  <SelectItem value="travel">Travel Only</SelectItem>
                  <SelectItem value="food">Food Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    {report.is_travel_expense && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Plane className="h-3 w-3" />
                        Travel
                      </Badge>
                    )}
                    {report.is_food_expense && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <UtensilsCrossed className="h-3 w-3" />
                        Food
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {report.employee?.full_name || "Unknown"} •{" "}
                    {report.employee?.department || "Unknown"} •{" "}
                    {report.category?.name || "Unknown"}
                  </CardDescription>
                  {report.is_travel_expense &&
                    report.from_location &&
                    report.to_location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {report.from_location} → {report.to_location}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </Badge>
                  <Dialog
                    open={dialogOpen && selectedReport?.id === report.id}
                    onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) setSelectedReport(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes(report.admin_notes || "");
                          setDialogOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {report.title}
                          {report.is_travel_expense && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Plane className="h-3 w-3" />
                              Travel Expense
                            </Badge>
                          )}
                        </DialogTitle>
                        <DialogDescription>
                          Review and update the status of this expense report
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                          <h4 className="font-semibold mb-3">
                            Basic Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">
                                Employee
                              </Label>
                              <p className="text-sm">
                                {report.employee?.full_name || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Department
                              </Label>
                              <p className="text-sm">
                                {report.employee?.department || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Category
                              </Label>
                              <p className="text-sm">{report.category.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Amount
                              </Label>
                              <p className="text-sm">
                                {formatCurrency(report.amount)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Expense Date
                              </Label>
                              <p className="text-sm">
                                {formatDate(report.expense_date)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Submitted
                              </Label>
                              <p className="text-sm">
                                {formatDate(report.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Travel Details */}
                        {report.is_travel_expense && (
                          <div className="p-4 border rounded-lg bg-blue-50">
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Plane className="mr-2 h-4 w-4" />
                              Travel Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">
                                  From Location
                                </Label>
                                <p className="text-sm">
                                  {report.from_location}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  To Location
                                </Label>
                                <p className="text-sm">{report.to_location}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Travel Start Date
                                </Label>
                                <p className="text-sm">
                                  {report.travel_start_date
                                    ? formatDate(report.travel_start_date)
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Travel End Date
                                </Label>
                                <p className="text-sm">
                                  {report.travel_end_date
                                    ? formatDate(report.travel_end_date)
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Transport Mode
                                </Label>
                                <p className="text-sm capitalize">
                                  {report.transport_mode}
                                </p>
                              </div>
                            </div>
                            {report.business_purpose && (
                              <div className="mt-4">
                                <Label className="text-sm font-medium">
                                  Business Purpose
                                </Label>
                                <p className="text-sm mt-1">
                                  {report.business_purpose}
                                </p>
                              </div>
                            )}
                            {report.accommodation_details && (
                              <div className="mt-4">
                                <Label className="text-sm font-medium">
                                  Accommodation Details
                                </Label>
                                <p className="text-sm mt-1">
                                  {report.accommodation_details}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Food Details */}
                        {report.is_food_expense && (
                          <div className="p-4 border rounded-lg bg-orange-50">
                            <h4 className="font-semibold mb-3 flex items-center">
                              <UtensilsCrossed className="mr-2 h-4 w-4" />
                              Food/Meal Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">
                                  Food/Meal Name
                                </Label>
                                <p className="text-sm">{report.food_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Meal Type
                                </Label>
                                <p className="text-sm">{report.meal_type}</p>
                              </div>
                              {report.restaurant_name && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Restaurant/Venue
                                  </Label>
                                  <p className="text-sm">
                                    {report.restaurant_name}
                                  </p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium">
                                  Number of Attendees
                                </Label>
                                <p className="text-sm">
                                  {report.number_of_attendees}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Dining Arrangement
                                </Label>
                                <p className="text-sm">
                                  {report.with_client
                                    ? "With client(s)"
                                    : "Alone/with colleagues"}
                                </p>
                              </div>
                            </div>
                            {report.with_client && report.client_name && (
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">
                                    Client Name
                                  </Label>
                                  <p className="text-sm">
                                    {report.client_name}
                                  </p>
                                </div>
                                {report.client_company && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Client Company
                                    </Label>
                                    <p className="text-sm">
                                      {report.client_company}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        {report.description && (
                          <div>
                            <Label className="text-sm font-medium">
                              Description
                            </Label>
                            <p className="text-sm mt-1">{report.description}</p>
                          </div>
                        )}

                        {/* Bill/Receipt */}
                        {report.bill_file_url && (
                          <div>
                            <Label className="text-sm font-medium">
                              Attached Bill/Receipt
                            </Label>
                            <div className="mt-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={report.bill_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  {report.bill_file_name || "View Bill"}
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        <div>
                          <Label htmlFor="adminNotes">Admin Notes</Label>
                          <Textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes for the employee..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleStatusUpdate(report.id, "rejected")
                            }
                            disabled={report.status !== "pending"}
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() =>
                              handleStatusUpdate(report.id, "approved")
                            }
                            disabled={report.status !== "pending"}
                          >
                            Approve
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="mr-1 h-4 w-4" />
                    {formatCurrency(report.amount)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(report.expense_date)}
                  </div>
                  {report.bill_file_url && (
                    <Badge variant="outline" className="text-xs">
                      Has Receipt
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Submitted {formatDate(report.created_at)}
                </div>
              </div>
              {report.admin_notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Admin Notes:
                  </p>
                  <p className="text-sm text-gray-600">{report.admin_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && reports.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No reports match filters
            </h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters to see more results.
            </p>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No expense reports found
            </h3>
            <p className="text-muted-foreground text-center">
              No expense reports have been submitted yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
