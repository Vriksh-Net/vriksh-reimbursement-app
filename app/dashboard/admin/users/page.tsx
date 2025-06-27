"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Mail,
  Building,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Crown,
  MoreVertical,
} from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: "employee" | "admin"
  department: string
  created_at: string
  last_login?: string
  is_active: boolean
}

interface UserStats {
  total_expenses: number
  pending_expenses: number
  approved_expenses: number
  total_amount: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "employee" as "employee" | "admin",
    department: "",
  })
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const { userProfile } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, departmentFilter, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not properly configured.")
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      setUsers(usersData || [])

      // Fetch user statistics
      if (usersData && usersData.length > 0) {
        await fetchUserStats(usersData)
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (usersData: AdminUser[]) => {
    try {
      const { data: expenseReports, error } = await supabase.from("expense_reports").select("user_id, amount, status")

      if (error) throw error

      const stats: Record<string, UserStats> = {}

      usersData.forEach((user) => {
        const userReports = expenseReports?.filter((report) => report.user_id === user.id) || []
        stats[user.id] = {
          total_expenses: userReports.length,
          pending_expenses: userReports.filter((r) => r.status === "pending").length,
          approved_expenses: userReports.filter((r) => r.status === "approved").length,
          total_amount: userReports.reduce((sum, r) => sum + Number(r.amount), 0),
        }
      })

      setUserStats(stats)
    } catch (error) {
      console.error("Error fetching user stats:", error)
      // Don't throw error for stats, just log it
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((user) => user.department === departmentFilter)
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const createUser = async () => {
    if (!newUser.email || !newUser.full_name || !newUser.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: newUser.email.trim(),
          full_name: newUser.full_name.trim(),
          role: newUser.role,
          department: newUser.department.trim(),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setUsers((prev) => [data, ...prev])
      setNewUser({ email: "", full_name: "", role: "employee", department: "" })
      setDialogOpen(false)

      toast({
        title: "Success",
        description: "User created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const updateUser = async () => {
    if (!editingUser) return

    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          email: editingUser.email.trim(),
          full_name: editingUser.full_name.trim(),
          role: editingUser.role,
          department: editingUser.department.trim(),
          is_active: editingUser.is_active,
        })
        .eq("id", editingUser.id)
        .select()
        .single()

      if (error) throw error

      setUsers((prev) => prev.map((user) => (user.id === editingUser.id ? data : user)))
      setEditingUser(null)
      setDialogOpen(false)

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      setUsers((prev) => prev.filter((user) => user.id !== userId))
      setDeleteDialogOpen(false)
      setUserToDelete(null)

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const uniqueDepartments = [...new Set(users.map((user) => user.department))]

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
            <h3 className="text-xl font-semibold mb-3">Error Loading Users</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">{error}</p>
            <Button onClick={fetchUsers} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">User Management</h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage system users, their roles, and monitor their activity across the platform
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Total Users: {users.length}</span>
          <span>•</span>
          <span>Showing: {filteredUsers.length}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchUsers} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUser(null)
                  setNewUser({ email: "", full_name: "", role: "employee", department: "" })
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingUser ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingUser ? "Edit User" : "Add New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update user information and permissions" : "Create a new user account"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={editingUser ? editingUser.email : newUser.email}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, email: e.target.value })
                        : setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="user@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userFullName">Full Name</Label>
                  <Input
                    id="userFullName"
                    value={editingUser ? editingUser.full_name : newUser.full_name}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, full_name: e.target.value })
                        : setNewUser({ ...newUser, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role</Label>
                  <Select
                    value={editingUser ? editingUser.role : newUser.role}
                    onValueChange={(value: "employee" | "admin") =>
                      editingUser
                        ? setEditingUser({ ...editingUser, role: value })
                        : setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Employee
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userDepartment">Department</Label>
                  <Input
                    id="userDepartment"
                    value={editingUser ? editingUser.department : newUser.department}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, department: e.target.value })
                        : setNewUser({ ...newUser, department: e.target.value })
                    }
                    placeholder="Engineering, Sales, Marketing, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingUser ? updateUser : createUser}>
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid gap-6"
             style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
          {filteredUsers.map((user) => {
            const stats = userStats[user.id] || {
              total_expenses: 0,
              pending_expenses: 0,
              approved_expenses: 0,
              total_amount: 0,
            }

            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200 h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{user.full_name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {user.role === "admin" ? (
                              <div className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                <span className="hidden sm:inline">Admin</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span className="hidden sm:inline">Employee</span>
                              </div>
                            )}
                          </Badge>
                          <Badge variant={user.is_active ? "outline" : "destructive"} className="text-xs">
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingUser(user)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{user.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                        <span className="text-sm sm:text-lg font-bold">{stats.total_expenses}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                        <span className="text-sm sm:text-lg font-bold">{stats.pending_expenses}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <span className="text-sm sm:text-lg font-bold">{stats.approved_expenses}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        <span className="text-xs sm:text-sm font-bold">
                          {stats.total_amount > 99999
                            ? `₹${(stats.total_amount / 100000).toFixed(1)}L`
                            : stats.total_amount > 999
                              ? `₹${(stats.total_amount / 1000).toFixed(1)}K`
                              : formatCurrency(stats.total_amount).replace("₹", "₹")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : users.length > 0 ? (
        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-3">No Users Found</h3>
              <p className="text-muted-foreground text-center mb-6">
                No users match your current search and filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setDepartmentFilter("all")
                  setRoleFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-3">No Users Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Get started by creating your first user account to manage the expense system.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.full_name}"? This action cannot be undone and will remove
              all associated expense reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUser(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
