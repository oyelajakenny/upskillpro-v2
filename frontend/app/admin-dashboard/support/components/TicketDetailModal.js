"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  CheckCircle,
  Clock,
  User,
  Mail,
  Tag,
  Calendar,
  MessageSquare,
} from "lucide-react";

const TicketDetailModal = ({ ticket, onClose, onUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [ticketData, setTicketData] = useState(ticket);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticket.ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticket.ticketId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ticket details");
      }

      const result = await response.json();
      setTicketData(result.data.ticket);
      setMessages(result.data.messages);
    } catch (err) {
      console.error("Error fetching ticket details:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticket.ticketId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: newMessage,
            isInternal: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      await fetchTicketDetails();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticket.ticketId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchTicketDetails();
      onUpdate();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (newPriority) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticket.ticketId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      await fetchTicketDetails();
      onUpdate();
    } catch (err) {
      console.error("Error updating priority:", err);
      alert("Failed to update priority");
    } finally {
      setUpdating(false);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert("Please provide resolution notes");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticket.ticketId}/resolve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resolutionNotes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve ticket");
      }

      await fetchTicketDetails();
      onUpdate();
      setShowResolveForm(false);
      setResolutionNotes("");
    } catch (err) {
      console.error("Error resolving ticket:", err);
      alert("Failed to resolve ticket");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "default";
      case "resolved":
        return "secondary";
      case "closed":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{ticketData.subject}</h2>
              <Badge variant={getStatusColor(ticketData.status)}>
                {ticketData.status}
              </Badge>
              <Badge variant={getPriorityColor(ticketData.priority)}>
                {ticketData.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 font-mono">
              Ticket ID: {ticketData.ticketId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Ticket Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <User className="w-4 h-4 mr-1" />
                User
              </div>
              <div className="font-medium">{ticketData.userName}</div>
            </div>
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Mail className="w-4 h-4 mr-1" />
                Email
              </div>
              <div className="font-medium">{ticketData.userEmail}</div>
            </div>
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Tag className="w-4 h-4 mr-1" />
                Category
              </div>
              <div className="font-medium">{ticketData.category}</div>
            </div>
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                Created
              </div>
              <div className="font-medium text-sm">
                {formatDate(ticketData.createdAt)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">Description</div>
            <div className="bg-white p-3 rounded border">
              {ticketData.description}
            </div>
          </div>

          {ticketData.status === "resolved" && ticketData.resolutionNotes && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Resolution Notes</div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                {ticketData.resolutionNotes}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-b bg-gray-50 flex gap-2 flex-wrap">
          {ticketData.status !== "resolved" && (
            <>
              <select
                value={ticketData.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={updating}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={ticketData.priority}
                onChange={(e) => handleUpdatePriority(e.target.value)}
                disabled={updating}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <Button
                size="sm"
                onClick={() => setShowResolveForm(!showResolveForm)}
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolve Ticket
              </Button>
            </>
          )}
        </div>

        {/* Resolve Form */}
        {showResolveForm && (
          <div className="p-4 border-b bg-yellow-50">
            <form onSubmit={handleResolveTicket}>
              <label className="block text-sm font-medium mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how this ticket was resolved..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
              <div className="flex gap-2 mt-2">
                <Button type="submit" disabled={loading} size="sm">
                  {loading ? "Resolving..." : "Confirm Resolution"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResolveForm(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold">Communication History</h3>
            <span className="text-sm text-gray-500">
              ({messages.length} messages)
            </span>
          </div>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No messages yet
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`p-4 rounded-lg ${
                    msg.senderRole === "super_admin"
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "bg-gray-50 border-l-4 border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{msg.senderName}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {msg.senderRole}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Input */}
        {ticketData.status !== "resolved" && (
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" disabled={loading || !newMessage.trim()}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailModal;
