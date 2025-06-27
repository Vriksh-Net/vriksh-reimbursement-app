"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Clock,
} from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

interface ExpenseCategory {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
}

interface MealType {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
}

interface SystemSettings {
  max_expense_amount: number
  require_receipts: boolean
  auto_approve_limit: number
  notification_email: string
  company_name: string
  currency_code: string
  fiscal_year_start: string
}

interface SystemStats {
  total_users: number
  total_reports: number
  pending_reports: number
  total_amount: number
}

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [settings, setSettings] = useState<SystemSettings>({
    max_expense_amount: 100000,
    require_receipts: true,
    auto_approve_limit: 5000,
    notification_email: "admin@company.com",
    company_name: "Your Company",
    currency_code: "INR",
    fiscal_year_start: "2024-04-01",
  })
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    total_reports: 0,
    pending_reports: 0,
    total_amount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [newMealType, setNewMealType] = useState({ name: "", description: "" })
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [editingMealType, setEditingMealType] = useState<MealType | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [mealTypeDialogOpen, setMealTypeDialogOpen] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not properly configured.")
      }

      await Promise.all([fetchCategories(), fetchMealTypes(), fetchSystemStats()])
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("expense_categories").select("*").order("name")

    if (error) throw error
    setCategories(data || [])
  }

  const fetchMealTypes = async () => {
    const { data, error } = await supabase.from("meal_types").select("*").order("name")

    if (error) throw error
    setMealTypes(data || [])
  }

  const fetchSystemStats = async () => {
    try {
      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })

      if (userError) throw userError

      // Get expense reports stats
      const { data: reports, error: reportsError } = await supabase.from("expense_reports").select("amount, status")

      if (reportsError) throw reportsError

      const totalReports = reports?.length || 0
      const pendingReports = reports?.filter((r) => r.status === "pending").length || 0
      const totalAmount = reports?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

      setStats({
        total_users: userCount || 0,
        total_reports: totalReports,
        pending_reports: pendingReports,
        total_amount: totalAmount,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Don't throw error for stats, just log it
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real app, you would save these to a settings table
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setCategories((prev) => [...prev, data])
      setNewCategory({ name: "", description: "" })
      setCategoryDialogOpen(false)

      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      })
    }
  }

  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return

    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .update({
          name: editingCategory.name.trim(),
          description: editingCategory.description.trim(),
          is_active: editingCategory.is_active,
        })
        .eq("id", editingCategory.id)
        .select()
        .single()

      if (error) throw error

      setCategories((prev) => prev.map((cat) => (cat.id === editingCategory.id ? data : cat)))
      setEditingCategory(null)
      setCategoryDialogOpen(false)

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", categoryId)

      if (error) throw error

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const createMealType = async () => {
    if (!newMealType.name.trim()) {
      toast({
        title: "Error",
        description: "Meal type name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("meal_types")
        .insert({
          name: newMealType.name.trim(),
          description: newMealType.description.trim(),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setMealTypes((prev) => [...prev, data])
      setNewMealType({ name: "", description: "" })
      setMealTypeDialogOpen(false)

      toast({
        title: "Success",
        description: "Meal type created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal type",
        variant: "destructive",
      })
    }
  }

  const updateMealType = async () => {
    if (!editingMealType || !editingMealType.name.trim()) return

    try {
      const { data, error } = await supabase
        .from("meal_types")
        .update({
          name: editingMealType.name.trim(),
          description: editingMealType.description.trim(),
          is_active: editingMealType.is_active,
        })
        .eq("id", editingMealType.id)
        .select()
        .single()

      if (error) throw error

      setMealTypes((prev) => prev.map((type) => (type.id === editingMealType.id ? data : type)))
      setEditingMealType(null)
      setMealTypeDialogOpen(false)

      toast({
        title: "Success",
        description: "Meal type updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal type",
        variant: "destructive",
      })
    }
  }

  const deleteMealType = async (mealTypeId: string) => {
    try {
      const { error } = await supabase.from("meal_types").delete().eq("id", mealTypeId)

      if (error) throw error

      setMealTypes((prev) => prev.filter((type) => type.id !== mealTypeId))

      toast({
        title: "Success",
        description: "Meal type deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal type",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Settings</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">{error}</p>
            <Button onClick={fetchAllData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>
        <Button onClick={fetchAllData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>Current system statistics and health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{stats.total_reports}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{stats.pending_reports}</div>
              <div className="text-sm text-muted-foreground">Pending Reports</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Manage expense categories for reports</CardDescription>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingCategory(null)
                    setNewCategory({ name: "", description: "" })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? "Update the category details" : "Create a new expense category"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={editingCategory ? editingCategory.name : newCategory.name}
                      onChange={(e) =>
                        editingCategory
                          ? setEditingCategory({ ...editingCategory, name: e.target.value })
                          : setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="e.g., Travel, Food, Office Supplies"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={editingCategory ? editingCategory.description : newCategory.description}
                      onChange={(e) =>
                        editingCategory
                          ? setEditingCategory({ ...editingCategory, description: e.target.value })
                          : setNewCategory({ ...newCategory, description: e.target.value })
                      }
                      placeholder="Brief description of this category"
                      rows={3}
                    />
                  </div>
                  {editingCategory && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="categoryActive"
                        checked={editingCategory.is_active}
                        onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })}
                      />
                      <Label htmlFor="categoryActive">Active</Label>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingCategory ? updateCategory : createCategory}>
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{category.name}</h4>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <p className="text-xs text-muted-foreground">Created: {formatDate(category.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category)
                      setCategoryDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{category.name}"? This action cannot be undone and may affect
                          existing expense reports.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory(category.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expense categories found.</p>
                <p className="text-sm">Create your first category to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meal Types */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Meal Types</CardTitle>
              <CardDescription>Manage meal types for food expenses</CardDescription>
            </div>
            <Dialog open={mealTypeDialogOpen} onOpenChange={setMealTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingMealType(null)
                    setNewMealType({ name: "", description: "" })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMealType ? "Edit Meal Type" : "Add New Meal Type"}</DialogTitle>
                  <DialogDescription>
                    {editingMealType ? "Update the meal type details" : "Create a new meal type"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mealTypeName">Meal Type Name</Label>
                    <Input
                      id="mealTypeName"
                      value={editingMealType ? editingMealType.name : newMealType.name}
                      onChange={(e) =>
                        editingMealType
                          ? setEditingMealType({ ...editingMealType, name: e.target.value })
                          : setNewMealType({ ...newMealType, name: e.target.value })
                      }
                      placeholder="e.g., Breakfast, Lunch, Dinner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mealTypeDescription">Description</Label>
                    <Textarea
                      id="mealTypeDescription"
                      value={editingMealType ? editingMealType.description : newMealType.description}
                      onChange={(e) =>
                        editingMealType
                          ? setEditingMealType({ ...editingMealType, description: e.target.value })
                          : setNewMealType({ ...newMealType, description: e.target.value })
                      }
                      placeholder="Brief description of this meal type"
                      rows={3}
                    />
                  </div>
                  {editingMealType && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mealTypeActive"
                        checked={editingMealType.is_active}
                        onCheckedChange={(checked) => setEditingMealType({ ...editingMealType, is_active: checked })}
                      />
                      <Label htmlFor="mealTypeActive">Active</Label>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMealTypeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingMealType ? updateMealType : createMealType}>
                    {editingMealType ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mealTypes.map((mealType) => (
              <div key={mealType.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{mealType.name}</h4>
                    <Badge variant={mealType.is_active ? "default" : "secondary"}>
                      {mealType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{mealType.description}</p>
                  <p className="text-xs text-muted-foreground">Created: {formatDate(mealType.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMealType(mealType)
                      setMealTypeDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Meal Type</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{mealType.name}"? This action cannot be undone and may affect
                          existing food expense reports.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMealType(mealType.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {mealTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meal types found.</p>
                <p className="text-sm">Create your first meal type to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
