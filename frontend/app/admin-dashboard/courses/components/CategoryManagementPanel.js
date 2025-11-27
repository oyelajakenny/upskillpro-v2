"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  DollarSign,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

const CategoryManagementPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
  });
  const [processingId, setProcessingId] = useState(null);

  // Fetch categories data
  const fetchCategories = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const result = await response.json();
      setCategories(result.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(error.message);
      // Set mock data for development
      setCategories([
        {
          categoryId: "web-development",
          name: "Web Development",
          description: "Frontend and backend web development courses",
          slug: "web-development",
          courseCount: 45,
          studentCount: 2340,
          totalRevenue: 45670.5,
          isActive: true,
          createdAt: "2023-06-15T10:00:00Z",
          updatedAt: "2024-01-15T14:30:00Z",
        },
        {
          categoryId: "data-science",
          name: "Data Science",
          description: "Machine learning, AI, and data analysis courses",
          slug: "data-science",
          courseCount: 32,
          studentCount: 1890,
          totalRevenue: 38920.75,
          isActive: true,
          createdAt: "2023-07-20T09:00:00Z",
          updatedAt: "2024-01-10T11:15:00Z",
        },
        {
          categoryId: "mobile-development",
          name: "Mobile Development",
          description:
            "iOS, Android, and cross-platform mobile app development",
          slug: "mobile-development",
          courseCount: 28,
          studentCount: 1456,
          totalRevenue: 29120.0,
          isActive: true,
          createdAt: "2023-08-10T16:00:00Z",
          updatedAt: "2024-01-05T08:45:00Z",
        },
        {
          categoryId: "design",
          name: "Design",
          description: "UI/UX design, graphic design, and creative courses",
          slug: "design",
          courseCount: 18,
          studentCount: 892,
          totalRevenue: 15680.25,
          isActive: true,
          createdAt: "2023-09-05T12:30:00Z",
          updatedAt: "2023-12-20T16:20:00Z",
        },
        {
          categoryId: "business",
          name: "Business",
          description: "Entrepreneurship, marketing, and business strategy",
          slug: "business",
          courseCount: 12,
          studentCount: 567,
          totalRevenue: 8940.0,
          isActive: false,
          createdAt: "2023-10-15T14:00:00Z",
          updatedAt: "2023-11-30T10:10:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from name
      ...(field === "name" && {
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      }),
    }));
  };

  // Handle add category
  const handleAddCategory = () => {
    setFormData({ name: "", description: "", slug: "" });
    setShowAddForm(true);
    setEditingCategory(null);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  // Handle save category
  const handleSaveCategory = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      setProcessingId("form");

      const isEditing = !!editingCategory;
      const endpoint = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${editingCategory.categoryId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isEditing ? "update" : "create"} category`
        );
      }

      const result = await response.json();

      if (isEditing) {
        // Update existing category
        setCategories((prev) =>
          prev.map((cat) =>
            cat.categoryId === editingCategory.categoryId
              ? { ...cat, ...formData, updatedAt: new Date().toISOString() }
              : cat
          )
        );
        toast.success("Category updated successfully");
      } else {
        // Add new category
        const newCategory = {
          categoryId: formData.slug,
          ...formData,
          courseCount: 0,
          studentCount: 0,
          totalRevenue: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCategory]);
        toast.success("Category created successfully");
      }

      handleCancelForm();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(
        `Failed to ${editingCategory ? "update" : "create"} category: ${
          error.message
        }`
      );

      // For development, simulate success
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.categoryId === editingCategory.categoryId
              ? { ...cat, ...formData, updatedAt: new Date().toISOString() }
              : cat
          )
        );
        toast.success("Category updated successfully (simulated)");
      } else {
        const newCategory = {
          categoryId: formData.slug,
          ...formData,
          courseCount: 0,
          studentCount: 0,
          totalRevenue: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCategory]);
        toast.success("Category created successfully (simulated)");
      }
      handleCancelForm();
    } finally {
      setProcessingId(null);
    }
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", slug: "" });
  };

  // Handle toggle category status
  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      setProcessingId(categoryId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${categoryId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle category status");
      }

      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.categoryId === categoryId
            ? {
                ...cat,
                isActive: !currentStatus,
                updatedAt: new Date().toISOString(),
              }
            : cat
        )
      );

      toast.success(
        `Category ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling category status:", error);
      toast.error(`Failed to toggle category status: ${error.message}`);

      // For development, simulate success
      setCategories((prev) =>
        prev.map((cat) =>
          cat.categoryId === categoryId
            ? {
                ...cat,
                isActive: !currentStatus,
                updatedAt: new Date().toISOString(),
              }
            : cat
        )
      );
      toast.success(
        `Category ${
          !currentStatus ? "activated" : "deactivated"
        } successfully (simulated)`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessingId(categoryId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      // Remove from local state
      setCategories((prev) =>
        prev.filter((cat) => cat.categoryId !== categoryId)
      );
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(`Failed to delete category: ${error.message}`);

      // For development, simulate success
      setCategories((prev) =>
        prev.filter((cat) => cat.categoryId !== categoryId)
      );
      toast.success("Category deleted successfully (simulated)");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchCategories();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate totals
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const totalCourses = categories.reduce((sum, c) => sum + c.courseCount, 0);
  const totalRevenue = categories.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Category Management
          </h2>
          <p className="text-gray-600">Organize and manage course categories</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-lg font-semibold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active Categories</p>
                <p className="text-lg font-semibold">{activeCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-lg font-semibold">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="category-slug">Slug</Label>
                <Input
                  id="category-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="category-slug"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={handleCancelForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={processingId === "form"}
              >
                {processingId === "form" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {processingId === "form" ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-800">Error: {error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading categories...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.categoryId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {category.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {category.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            Slug: {category.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            category.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                          {category.courseCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {category.studentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                          {formatCurrency(category.totalRevenue)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(category.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            title="Edit Category"
                            disabled={processingId === category.categoryId}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(
                                category.categoryId,
                                category.isActive
                              )
                            }
                            title={
                              category.isActive ? "Deactivate" : "Activate"
                            }
                            disabled={processingId === category.categoryId}
                          >
                            {category.isActive ? (
                              <X className="h-4 w-4 text-red-600" />
                            ) : (
                              <Tag className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteCategory(category.categoryId)
                            }
                            title="Delete Category"
                            disabled={
                              processingId === category.categoryId ||
                              category.courseCount > 0
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {categories.length === 0 && (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No categories found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagementPanel;
