"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Bell,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import AnnouncementModal from "./components/AnnouncementModal";
import NotificationModal from "./components/NotificationModal";
import TemplateModal from "./components/TemplateModal";

const CommunicationsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [announcements, setAnnouncements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("announcements");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/announcements`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }

      const result = await response.json();
      setAnnouncements(result.data.announcements);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/templates`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const result = await response.json();
      setTemplates(result.data.templates);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === "announcements") {
        fetchAnnouncements();
      } else if (activeTab === "templates") {
        fetchTemplates();
      }
    }
  }, [token, activeTab]);

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/announcements/${announcementId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Failed to delete announcement");
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedItem(announcement);
    setShowAnnouncementModal(true);
  };

  const handleItemUpdated = () => {
    if (activeTab === "announcements") {
      fetchAnnouncements();
    } else if (activeTab === "templates") {
      fetchTemplates();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "default";
      case "scheduled":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "secondary";
      default:
        return "default";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "info":
        return "default";
      case "warning":
        return "destructive";
      case "success":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Communications Center</h1>
          <p className="text-gray-500 mt-1">
            Manage platform announcements, notifications, and templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNotificationModal(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Announcements
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Announcements
            </CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter((a) => a.status === "published").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter((a) => a.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Platform Announcements</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchAnnouncements}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  setShowAnnouncementModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">No announcements found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.announcementId}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {announcement.title}
                            </h3>
                            <Badge
                              variant={getStatusColor(announcement.status)}
                            >
                              {announcement.status}
                            </Badge>
                            <Badge variant={getTypeColor(announcement.type)}>
                              {announcement.type}
                            </Badge>
                            {announcement.priority === "urgent" && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {announcement.targetAudience}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(announcement.createdAt)}
                            </span>
                            {announcement.scheduledFor && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Scheduled:{" "}
                                {formatDate(announcement.scheduledFor)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAnnouncement(announcement)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteAnnouncement(
                                announcement.announcementId
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notification Templates</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchTemplates}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button onClick={() => setShowTemplateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.templateId}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.subject}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {template.channels?.join(", ") || "No channels"}
                        </span>
                        {template.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAnnouncementModal && (
        <AnnouncementModal
          announcement={selectedItem}
          onClose={() => {
            setShowAnnouncementModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleItemUpdated}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          onClose={() => setShowNotificationModal(false)}
          onSend={handleItemUpdated}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onCreate={handleItemUpdated}
        />
      )}
    </div>
  );
};

export default CommunicationsPage;
