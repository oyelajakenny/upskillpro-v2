"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Activity,
} from "lucide-react";
import UserProfileModal from "./components/UserProfileModal";
import BulkOperationsModal from "./components/BulkOperationsModal";
import RoleManagementModal from "./components/RoleManagementModal";
import AccountStatusModal from "./components/AccountStatusModal";
import UserActivityModal from "./components/UserActivityModal";

const UserManagementPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 50,
    lastEvaluatedKey: null,
    hasMore: false,
  });

  // Fetch users data
  const fetchUsers = async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setPagination((prev) => ({ ...prev, lastEvaluatedKey: null }));
      }

      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        ...(pagination.lastEvaluatedKey &&
          !reset && { lastEvaluatedKey: pagination.lastEvaluatedKey }),
        ...(selectedRole && { role: selectedRole }),
        ...(selectedStatus && { accountStatus: selectedStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();

      if (reset) {
        setUsers(result.data.users);
      } else {
        setUsers((prev) => [...prev, ...result.data.users]);
      }

      setPagination((prev) => ({
        ...prev,
        lastEvaluatedKey: result.data.lastEvaluatedKey,
        hasMore: !!result.data.lastEvaluatedKey,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
      // Set mock data for development
      if (reset) {
        setUsers([
          {
            userId: "user-1",
            name: "John Doe",
            email: "john.doe@example.com",
            role: "student",
            accountStatus: "active",
            createdAt: "2024-01-15T10:00:00Z",
            lastLoginAt: "2024-01-20T14:30:00Z",
            loginCount: 25,
            profilePicture: null,
          },
          {
            userId: "user-2",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            role: "instructor",
            accountStatus: "active",
            createdAt: "2024-01-10T09:00:00Z",
            lastLoginAt: "2024-01-21T11:15:00Z",
            loginCount: 45,
            profilePicture: null,
          },
          {
            userId: "user-3",
            name: "Bob Johnson",
            email: "bob.johnson@example.com",
            role: "student",
            accountStatus: "suspended",
            createdAt: "2024-01-05T16:00:00Z",
            lastLoginAt: "2024-01-18T08:45:00Z",
            loginCount: 12,
            profilePicture: null,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers(true);
  }, [token, selectedRole, selectedStatus, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle role filter
  const handleRoleFilter = (role) => {
    setSelectedRole(role === selectedRole ? "" : role);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setSelectedStatus(status === selectedStatus ? "" : status);
  };

  // Handle user selection
  const handleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.userId));
    }
  };

  // Handle view user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Handle user update from modal
  const handleUserUpdate = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === updatedUser.userId ? updatedUser : user
      )
    );
  };

  // Handle bulk operations
  const handleBulkOperation = (operation) => {
    if (selectedUsers.length === 0) return;
    setShowBulkModal(true);
  };

  // Handle bulk operation completion
  const handleBulkOperationComplete = (results) => {
    // Refresh users data to reflect changes
    fetchUsers(true);
    // Clear selected users
    setSelectedUsers([]);
    // Close modal after a delay to show results
    setTimeout(() => {
      setShowBulkModal(false);
    }, 3000);
  };

  // Handle role management
  const handleManageRole = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // Handle status management
  const handleManageStatus = (user) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  // Handle activity monitoring
  const handleViewActivity = (user) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  // Handle role update
  const handleRoleUpdate = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === updatedUser.userId ? updatedUser : user
      )
    );
  };

  // Handle status update
  const handleStatusUpdate = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === updatedUser.userId ? updatedUser : user
      )
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      instructor: "bg-green-100 text-green-800",
      student: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.student;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            User Management
          </h1>
          <p className="text-gray-600">
            Manage all users, roles, and account statuses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Role:</span>
              <div className="flex space-x-2">
                {["student", "instructor", "admin", "super_admin"].map(
                  (role) => (
                    <Button
                      key={role}
                      variant={selectedRole === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRoleFilter(role)}
                    >
                      {role.replace("_", " ")}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex space-x-2">
                {["active", "suspended", "pending"].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("activate")}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("suspend")}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("changeRole")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({users.length})</span>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-800">Error: {error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        users.length > 0 &&
                        selectedUsers.length === users.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Login Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => handleUserSelection(user.userId)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeColor(user.accountStatus)}
                      >
                        {user.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.loginCount || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageRole(user)}
                          title="Manage Role"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageStatus(user)}
                          title="Manage Status"
                        >
                          {user.accountStatus === "active" ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewActivity(user)}
                          title="View Activity"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Load More */}
          {pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => fetchUsers(false)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More Users"}
              </Button>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onUserUpdate={handleUserUpdate}
      />

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        selectedUsers={selectedUsers}
        allUsers={users}
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onOperationComplete={handleBulkOperationComplete}
      />

      {/* Role Management Modal */}
      <RoleManagementModal
        user={selectedUser}
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        onRoleUpdate={handleRoleUpdate}
      />

      {/* Account Status Modal */}
      <AccountStatusModal
        user={selectedUser}
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedUser(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* User Activity Modal */}
      <UserActivityModal
        user={selectedUser}
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UserManagementPage;
