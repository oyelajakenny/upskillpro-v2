"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Database,
  HardDrive,
  Trash2,
  Download,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MaintenancePage = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [storageMetrics, setStorageMetrics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState([]);

  // Dialog states
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // Form states
  const [cleanupForm, setCleanupForm] = useState({
    cleanupType: "old_audit_logs",
    daysOld: 90,
    dryRun: true,
  });

  const [backupForm, setBackupForm] = useState({
    backupType: "full",
    includeData: [],
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    maintenanceType: "scheduled",
    affectedServices: [],
    notifyUsers: true,
  });

  const fetchStorageMetrics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/storage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch storage metrics");
      }

      const data = await response.json();
      setStorageMetrics(data.data);
    } catch (err) {
      console.error("Error fetching storage metrics:", err);
      throw err;
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/backups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch backups");
      }

      const data = await response.json();
      setBackups(data.data.backups || []);
    } catch (err) {
      console.error("Error fetching backups:", err);
      throw err;
    }
  };

  const fetchMaintenanceWindows = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/maintenance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch maintenance windows");
      }

      const data = await response.json();
      setMaintenanceWindows(data.data.maintenanceWindows || []);
    } catch (err) {
      console.error("Error fetching maintenance windows:", err);
      throw err;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStorageMetrics(),
        fetchBackups(),
        fetchMaintenanceWindows(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const handleDataCleanup = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanupForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to perform data cleanup");
      }

      const data = await response.json();
      setSuccess(data.message);
      setCleanupDialogOpen(false);
      await fetchStorageMetrics();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/backups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(backupForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create backup");
      }

      const data = await response.json();
      setSuccess(data.message);
      setBackupDialogOpen(false);
      await fetchBackups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/backups/${selectedBackup.backupId}/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ restoreOptions: {} }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to restore backup");
      }

      const data = await response.json();
      setSuccess(data.message);
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/maintenance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(maintenanceForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to schedule maintenance");
      }

      const data = await response.json();
      setSuccess(data.message);
      setMaintenanceDialogOpen(false);
      await fetchMaintenanceWindows();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      scheduled: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={statusColors[status] || statusColors.pending}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading maintenance tools...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Maintenance & Database Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage data cleanup, backups, and system maintenance
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Storage Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Storage Used</p>
              <p className="text-2xl font-bold">
                {formatBytes(storageMetrics?.totalStorageUsed)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Database Size</p>
              <p className="text-2xl font-bold">
                {formatBytes(storageMetrics?.databaseSize)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">S3 Storage</p>
              <p className="text-2xl font-bold">
                {formatBytes(storageMetrics?.s3StorageUsed)}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setCleanupDialogOpen(true)}
            className="w-full md:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Run Data Cleanup
          </Button>
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Backup Management
            </CardTitle>
            <Button onClick={() => setBackupDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No backups available
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.backupId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">
                          {backup.backupType} Backup
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(backup.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-600">
                        Size: {formatBytes(backup.size)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Items: {backup.itemCount || 0}
                      </p>
                    </div>
                    {getStatusBadge(backup.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreDialogOpen(true);
                      }}
                      disabled={backup.status !== "completed"}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Windows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Scheduled Maintenance
            </CardTitle>
            <Button onClick={() => setMaintenanceDialogOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceWindows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scheduled maintenance windows
            </div>
          ) : (
            <div className="space-y-3">
              {maintenanceWindows.map((maintenance) => (
                <div
                  key={maintenance.maintenanceId}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <h3 className="font-medium">{maintenance.title}</h3>
                        {getStatusBadge(maintenance.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {maintenance.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Start Time</p>
                          <p className="font-medium">
                            {formatDate(maintenance.startTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Time</p>
                          <p className="font-medium">
                            {formatDate(maintenance.endTime)}
                          </p>
                        </div>
                      </div>
                      {maintenance.affectedServices?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Affected Services:{" "}
                            {maintenance.affectedServices.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Cleanup Dialog */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data Cleanup</DialogTitle>
            <DialogDescription>
              Remove old or unnecessary data to optimize storage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cleanupType">Cleanup Type</Label>
              <Select
                value={cleanupForm.cleanupType}
                onValueChange={(value) =>
                  setCleanupForm({ ...cleanupForm, cleanupType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="old_audit_logs">Old Audit Logs</SelectItem>
                  <SelectItem value="expired_sessions">
                    Expired Sessions
                  </SelectItem>
                  <SelectItem value="temp_files">Temporary Files</SelectItem>
                  <SelectItem value="old_notifications">
                    Old Notifications
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="daysOld">Days Old (older than)</Label>
              <Input
                id="daysOld"
                type="number"
                value={cleanupForm.daysOld}
                onChange={(e) =>
                  setCleanupForm({
                    ...cleanupForm,
                    daysOld: parseInt(e.target.value),
                  })
                }
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={cleanupForm.dryRun}
                onChange={(e) =>
                  setCleanupForm({ ...cleanupForm, dryRun: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="dryRun" className="cursor-pointer">
                Dry run (preview only, don't delete)
              </Label>
            </div>

            {cleanupForm.dryRun && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This is a dry run. No data will be deleted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCleanupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDataCleanup}>
              {cleanupForm.dryRun ? "Preview Cleanup" : "Run Cleanup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Create a backup of your platform data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="backupType">Backup Type</Label>
              <Select
                value={backupForm.backupType}
                onValueChange={(value) =>
                  setBackupForm({ ...backupForm, backupType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">
                    Incremental Backup
                  </SelectItem>
                  <SelectItem value="selective">Selective Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backupForm.backupType === "selective" && (
              <div>
                <Label>Include Data Types</Label>
                <div className="space-y-2 mt-2">
                  {["users", "courses", "enrollments", "settings"].map(
                    (type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={type}
                          checked={backupForm.includeData.includes(type)}
                          onChange={(e) => {
                            const newIncludeData = e.target.checked
                              ? [...backupForm.includeData, type]
                              : backupForm.includeData.filter(
                                  (t) => t !== type
                                );
                            setBackupForm({
                              ...backupForm,
                              includeData: newIncludeData,
                            });
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={type} className="cursor-pointer">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Backup process may take several minutes depending on data size.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBackupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>Create Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              Restore data from the selected backup
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Backup Details</p>
                <p className="font-medium mt-1">
                  {selectedBackup.backupType} Backup
                </p>
                <p className="text-sm text-gray-500">
                  Created: {formatDate(selectedBackup.createdAt)}
                </p>
                <p className="text-sm text-gray-500">
                  Size: {formatBytes(selectedBackup.size)}
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Restoring this backup will overwrite current data.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setSelectedBackup(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestoreBackup}>
              Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Window</DialogTitle>
            <DialogDescription>
              Schedule a maintenance window and notify users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={maintenanceForm.title}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    title: e.target.value,
                  })
                }
                placeholder="e.g., Database Upgrade"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the maintenance work..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={maintenanceForm.startTime}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={maintenanceForm.endTime}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      endTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maintenanceType">Maintenance Type</Label>
              <Select
                value={maintenanceForm.maintenanceType}
                onValueChange={(value) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    maintenanceType: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="upgrade">System Upgrade</SelectItem>
                  <SelectItem value="patch">Security Patch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyUsers"
                checked={maintenanceForm.notifyUsers}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    notifyUsers: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="notifyUsers" className="cursor-pointer">
                Notify all users about this maintenance
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleMaintenance}>
              Schedule Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenancePage;
