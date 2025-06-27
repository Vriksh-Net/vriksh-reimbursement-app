// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Plus, Calendar, DollarSign } from "lucide-react";
// import { supabase } from "@/lib/supabase";
// import { useAuth } from "@/lib/auth-context";
// import { toast } from "@/hooks/use-toast";

// interface ExpenseReport {
//   id: string;
//   title: string;
//   amount: number;
//   expense_date: string;
//   status: "pending" | "approved" | "rejected";
//   created_at: string;
//   expense_categories: {
//     name: string;
//   };
//   admin_notes?: string;
// }

// export default function MyReportsPage() {
//   const [reports, setReports] = useState<ExpenseReport[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { userProfile } = useAuth();

//   useEffect(() => {
//     if (userProfile) {
//       fetchReports();
//     }
//   }, [userProfile]);

//   const fetchReports = async () => {
//     if (!userProfile) return;

//     try {
//       const { data, error } = await supabase
//         .from("expense_reports")
//         .select(
//           `
//           *,
//           expense_categories (name)
//         `
//         )
//         .eq("user_id", userProfile.id)
//         .order("created_at", { ascending: false });

//       if (error) {
//         throw error;
//       }

//       setReports(data || []);
//     } catch (error) {
//       console.error("Error fetching reports:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load expense reports",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "approved":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-yellow-100 text-yellow-800";
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString();
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//     }).format(amount);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">
//             My Expense Reports
//           </h1>
//           <p className="text-muted-foreground">
//             View and track your submitted expense reports
//           </p>
//         </div>
//         <Button asChild>
//           <Link href="/dashboard/submit">
//             <Plus className="mr-2 h-4 w-4" />
//             Submit New Expense
//           </Link>
//         </Button>
//       </div>

//       {reports.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">
//               No expense reports yet
//             </h3>
//             <p className="text-muted-foreground text-center mb-4">
//               You haven't submitted any expense reports. Get started by
//               submitting your first expense.
//             </p>
//             <Button asChild>
//               <Link href="/dashboard/submit">
//                 <Plus className="mr-2 h-4 w-4" />
//                 Submit Your First Expense
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid gap-4">
//           {reports.map((report) => (
//             <Card key={report.id}>
//               <CardHeader>
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <CardTitle className="text-lg">{report.title}</CardTitle>
//                     <CardDescription>
//                       {report.expense_categories.name} • Submitted on{" "}
//                       {formatDate(report.created_at)}
//                     </CardDescription>
//                   </div>
//                   <Badge className={getStatusColor(report.status)}>
//                     {report.status.charAt(0).toUpperCase() +
//                       report.status.slice(1)}
//                   </Badge>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <div className="flex items-center text-sm text-muted-foreground">
//                       <DollarSign className="mr-1 h-4 w-4" />
//                       {formatCurrency(report.amount)}
//                     </div>
//                     <div className="flex items-center text-sm text-muted-foreground">
//                       <Calendar className="mr-1 h-4 w-4" />
//                       {formatDate(report.expense_date)}
//                     </div>
//                   </div>
//                 </div>
//                 {report.admin_notes && (
//                   <div className="mt-3 p-3 bg-gray-50 rounded-md">
//                     <p className="text-sm font-medium text-gray-900 mb-1">
//                       Admin Notes:
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       {report.admin_notes}
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Calendar, DollarSign, Eye, FileText, Clock, CheckCircle, CreditCard, Banknote } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { ExpenseTracker } from "@/components/expense-tracker"

interface ExpenseReport {
  id: string
  title: string
  amount: number
  expense_date: string
  current_stage: string
  created_at: string
  expense_categories: {
    name: string
  }
  admin_notes?: string
}

const STAGE_CONFIG = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: FileText },
  pending_accounts: { label: "Accounts Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  pending_manager: { label: "Manager Approval", color: "bg-orange-100 text-orange-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pending_fund_transfer: { label: "Fund Transfer", color: "bg-purple-100 text-purple-800", icon: CreditCard },
  fund_transferred: { label: "Completed", color: "bg-emerald-100 text-emerald-800", icon: Banknote },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: FileText },
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    if (userProfile) {
      fetchReports()
    }
  }, [userProfile])

  const fetchReports = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from("expense_reports")
        .select(`
          *,
          expense_categories (name)
        `)
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setReports(data || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to load expense reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getStageInfo = (stage: string) => {
    return STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG] || STAGE_CONFIG.submitted
  }

  const handleTrackExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId)
    setTrackingDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Expense Reports</h1>
          <p className="text-muted-foreground">View and track your submitted expense reports</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/submit">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Expense
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expense reports yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't submitted any expense reports. Get started by submitting your first expense.
            </p>
            <Button asChild>
              <Link href="/dashboard/submit">
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const stageInfo = getStageInfo(report.current_stage)
            const StageIcon = stageInfo.icon

            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>
                        {report.expense_categories.name} • Submitted on {formatDate(report.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={stageInfo.color}>
                        <StageIcon className="mr-1 h-3 w-3" />
                        {stageInfo.label}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleTrackExpense(report.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Track
                      </Button>
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
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>
                        {report.current_stage === "fund_transferred"
                          ? "100%"
                          : report.current_stage === "rejected"
                            ? "Rejected"
                            : "In Progress"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          report.current_stage === "rejected"
                            ? "bg-red-500"
                            : report.current_stage === "submitted"
                              ? "bg-blue-500 w-[16%]"
                              : report.current_stage === "pending_accounts"
                                ? "bg-yellow-500 w-[33%]"
                                : report.current_stage === "pending_manager"
                                  ? "bg-orange-500 w-[50%]"
                                  : report.current_stage === "approved"
                                    ? "bg-green-500 w-[66%]"
                                    : report.current_stage === "pending_fund_transfer"
                                      ? "bg-purple-500 w-[83%]"
                                      : report.current_stage === "fund_transferred"
                                        ? "bg-emerald-500 w-full"
                                        : "bg-gray-400 w-[16%]"
                        }`}
                      />
                    </div>
                  </div>

                  {report.admin_notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{report.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Expense Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Tracking</DialogTitle>
          </DialogHeader>
          {selectedExpenseId && (
            <ExpenseTracker expenseId={selectedExpenseId} onClose={() => setTrackingDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
