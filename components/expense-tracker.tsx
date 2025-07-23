"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, FileText, User, CreditCard, Banknote, AlertCircle, Eye, Calendar, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface WorkflowStep {
  id: string
  expense_report_id: string
  stage: string
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  approver?: {
    full_name: string
    email: string
  }
}

interface ExpenseWithWorkflow {
  id: string
  title: string
  amount: number
  expense_date: string
  current_stage: string
  created_at: string
  category: {
    name: string
  }
  workflow_steps: WorkflowStep[]
}

interface ExpenseTrackerProps {
  expenseId: string
  onClose?: () => void
}

const WORKFLOW_STAGES = [
  {
    key: "submitted",
    label: "Submitted",
    description: "Expense report submitted",
    icon: FileText,
    color: "bg-blue-500",
  },
  {
    key: "pending_accounts",
    label: "Accounts Review",
    description: "Pending review by accounts team",
    icon: User,
    color: "bg-yellow-500",
  },
  {
    key: "pending_manager",
    label: "Manager Approval",
    description: "Pending approval from manager",
    icon: User,
    color: "bg-orange-500",
  },
  {
    key: "approved",
    label: "Approved",
    description: "Expense approved for payment",
    icon: CheckCircle,
    color: "bg-green-500",
  }
]

export function ExpenseTracker({ expenseId, onClose }: ExpenseTrackerProps) {
  const [expense, setExpense] = useState<ExpenseWithWorkflow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenseWithWorkflow()
  }, [expenseId])

  const fetchExpenseWithWorkflow = async () => {
    try {
      // Fetch expense report
      const { data: expenseData, error: expenseError } = await supabase
        .from("expense_reports")
        .select(`
          id,
          title,
          amount,
          expense_date,
          current_stage,
          created_at,
          expense_categories!category_id (
            name
          )
        `)
        .eq("id", expenseId)
        .single()

      if (expenseError) throw expenseError

      // Fetch workflow steps
      const { data: workflowData, error: workflowError } = await supabase
        .from("expense_workflow")
        .select(`
          *,
          users!approved_by (
            full_name,
            email
          )
        `)
        .eq("expense_report_id", expenseId)
        .order("created_at", { ascending: true })

      if (workflowError) throw workflowError

      setExpense({
        ...expenseData,
        category: (Array.isArray(expenseData.expense_categories) && expenseData.expense_categories.length > 0)
          ? expenseData.expense_categories[0]
          : { name: "Unknown" },
        workflow_steps: workflowData.map((step) => ({
          ...step,
          approver: step.users,
        })),
      })
    } catch (error: any) {
      console.error("Error fetching expense workflow:", error)
      toast({
        title: "Error",
        description: "Failed to load expense tracking information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStageIndex = () => {
    if (!expense) return 0
    return WORKFLOW_STAGES.findIndex((stage) => stage.key === expense.current_stage)
  }

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStageIndex()
    if (expense?.current_stage === "rejected") return 0
    return ((currentIndex + 1) / WORKFLOW_STAGES.length) * 100
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getStageStatus = (stageKey: string) => {
    if (!expense) return "pending"

    const currentIndex = getCurrentStageIndex()
    const stageIndex = WORKFLOW_STAGES.findIndex((s) => s.key === stageKey)

    if (expense.current_stage === "rejected") {
      return stageIndex === 0 ? "completed" : "cancelled"
    }

    if (stageIndex < currentIndex) return "completed"
    if (stageIndex === currentIndex) return "current"
    return "pending"
  }

  const getWorkflowStepForStage = (stageKey: string) => {
    return expense?.workflow_steps.find((step) => step.stage === stageKey)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-4">Loading tracking information...</p>
        </CardContent>
      </Card>
    )
  }

  if (!expense) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Expense Not Found</h3>
          <p className="text-muted-foreground text-center">
            The expense report could not be found or you don't have permission to view it.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{expense.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(expense.amount)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(expense.expense_date)}
                </div>
                <Badge variant="outline">{expense.category.name}</Badge>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {expense.current_stage === "rejected"
                    ? "Rejected"
                    : `${Math.round(getProgressPercentage())}% Complete`}
                </span>
              </div>
              <Progress
                value={getProgressPercentage()}
                className={`h-2 ${expense.current_stage === "rejected" ? "bg-red-100" : ""}`}
              />
            </div>

            {expense.current_stage === "rejected" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Expense Rejected</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  This expense report has been rejected and will not be processed for payment.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Tracking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {WORKFLOW_STAGES.map((stage, index) => {
              const status = getStageStatus(stage.key)
              const workflowStep = getWorkflowStepForStage(stage.key)
              const Icon = stage.icon

              return (
                <div key={stage.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${status === "completed" ? `${stage.color} text-white` : ""}
                        ${status === "current" ? `${stage.color} text-white animate-pulse` : ""}
                        ${status === "pending" ? "bg-gray-200 text-gray-400" : ""}
                        ${status === "cancelled" ? "bg-red-100 text-red-400" : ""}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < WORKFLOW_STAGES.length - 1 && (
                      <div
                        className={`
                          w-0.5 h-12 mt-2
                          ${status === "completed" ? "bg-green-300" : "bg-gray-200"}
                        `}
                      />
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{stage.label}</h3>
                      {status === "completed" && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Completed
                        </Badge>
                      )}
                      {status === "current" && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          In Progress
                        </Badge>
                      )}
                      {status === "cancelled" && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Cancelled
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>

                    {workflowStep && (
                      <div className="space-y-2">
                        {workflowStep.approved_at && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Completed on: </span>
                            <span className="font-medium">{formatDate(workflowStep.approved_at)}</span>
                          </div>
                        )}

                        {workflowStep.approver && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">By: </span>
                            <span className="font-medium">{workflowStep.approver.full_name}</span>
                          </div>
                        )}

                        {workflowStep.notes && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Notes: </span>
                            <span className="italic">{workflowStep.notes}</span>
                          </div>
                        )}

                        {!workflowStep.approved_at && status === "current" && (
                          <div className="text-sm text-blue-600">
                            <span>Started on: {formatDate(workflowStep.created_at)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {status === "current" && !workflowStep && (
                      <div className="text-sm text-blue-600">Waiting to start...</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
