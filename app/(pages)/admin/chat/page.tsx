"use client";
export const runtime = 'edge';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Send,
  X,
  CheckCircle,
  Trash2,
  RefreshCw,
  Search,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface ChatConversation {
  id: number;
  participantId: number;
  participantName: string;
  participantEmail: string;
  adminId?: number;
  type: "user_admin" | "user_seller";
  status: "open" | "closed";
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

function formatTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins}p trước`;
  if (diffHours < 24) return `${diffHours}g trước`;
  if (diffDays < 7) return `${diffDays}ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const userRole = String((session?.user as any)?.role || "");
  const userId = Number((session?.user as any)?.id || 0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || userRole !== "admin") {
      router.push("/signin");
    }
  }, [status, session, userRole, router]);

  useEffect(() => {
    if (!session || userRole !== "admin") return;
    fetchConversations();
  }, [session, userRole]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/admin/chat");
      if (res.data.conversations) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = useCallback(async (conversationId: number, silent = false) => {
    try {
      const res = await axios.get(`/api/chat/${conversationId}`);
      if (res.data.conversation && res.data.messages) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: res.data.messages, unreadCount: 0 }
              : c
          )
        );
        if (activeConversation?.id === conversationId) {
          setActiveConversation((prev) =>
            prev && prev.id === conversationId
              ? { ...prev, messages: res.data.messages, unreadCount: 0 }
              : prev
          );
        }
      }
    } catch (err) {
      if (!silent) console.error("Error fetching messages:", err);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      scrollToBottom();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    if (!activeConversation) return;
    pollingRef.current = setInterval(() => {
      fetchMessages(activeConversation.id, true);
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    if (activeConversation?.messages) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);

  const handleSend = async () => {
    if (!message.trim() || !activeConversation || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await axios.post(`/api/chat/${activeConversation.id}`, { content });
      await fetchMessages(activeConversation.id);
    } catch (err) {
      setMessage(content);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCloseConversation = async (conversationId: number) => {
    try {
      await axios.post("/api/admin/chat", {
        action: "close",
        conversationId,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, status: "closed" } : c
        )
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation((prev) =>
          prev && prev.id === conversationId ? { ...prev, status: "closed" } : prev
        );
      }
      toast.success("Đã đóng cuộc trò chuyện");
    } catch {
      toast.error("Không thể đóng cuộc trò chuyện");
    }
  };

  const handleReopenConversation = async (conversationId: number) => {
    try {
      await axios.post("/api/admin/chat", {
        action: "reopen",
        conversationId,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, status: "open" } : c
        )
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation((prev) =>
          prev && prev.id === conversationId ? { ...prev, status: "open" } : prev
        );
      }
      toast.success("Đã mở lại cuộc trò chuyện");
    } catch {
      toast.error("Không thể mở lại cuộc trò chuyện");
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (!confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;
    try {
      await axios.post("/api/admin/chat", {
        action: "delete",
        conversationId,
      });
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
      toast.success("Đã xóa cuộc trò chuyện");
    } catch {
      toast.error("Không thể xóa cuộc trò chuyện");
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchQuery === "" ||
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && conv.status === "open") ||
      (statusFilter === "closed" && conv.status === "closed");

    return matchesSearch && matchesStatus;
  });

  const openCount = conversations.filter((c) => c.status === "open").length;
  const closedCount = conversations.filter((c) => c.status === "closed").length;

  if (status === "loading" || isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Quản lý Chat
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {openCount} cuộc trò chuyện đang mở, {closedCount} đã đóng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConversations}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên, email, tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "bg-primary-600" : ""}
          >
            Tất cả ({conversations.length})
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
            className={statusFilter === "open" ? "bg-green-600" : "text-green-600"}
          >
            Mở ({openCount})
          </Button>
          <Button
            variant={statusFilter === "closed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("closed")}
            className={statusFilter === "closed" ? "bg-slate-600" : "text-slate-600"}
          >
            Đóng ({closedCount})
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
        {/* Conversation List */}
        <div
          className={cn(
            "bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col",
            showMobileDetail && activeConversation ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Danh sách cuộc trò chuyện</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm text-center">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setShowMobileDetail(true);
                    }}
                    className={cn(
                      "w-full p-4 text-left hover:bg-slate-50 transition-colors",
                      activeConversation?.id === conv.id && "bg-primary-50 border-l-2 border-primary-600",
                      conv.unreadCount > 0 && conv.id !== activeConversation?.id && "bg-blue-50/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm shrink-0">
                        {(conv.participantName || conv.participantEmail || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-900 truncate">
                            {conv.participantName || conv.participantEmail || "Người dùng"}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {conv.lastMessage || "Chưa có tin nhắn"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                              conv.status === "open"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {conv.status === "open" ? "Mở" : "Đã đóng"}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Detail */}
        <div
          className={cn(
            "bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col",
            !activeConversation ? "hidden lg:flex" : "flex",
            showMobileDetail && "lg:col-span-2"
          )}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowMobileDetail(false);
                      setActiveConversation(null);
                    }}
                    className="lg:hidden p-1 hover:bg-slate-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
                    {(activeConversation.participantName || activeConversation.participantEmail || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {activeConversation.participantName || activeConversation.participantEmail || "Người dùng"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeConversation.participantEmail || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeConversation.status === "open" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseConversation(activeConversation.id)}
                      className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đóng
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReopenConversation(activeConversation.id)}
                      className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Mở lại
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteConversation(activeConversation.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {activeConversation.messages?.map((msg, index) => {
                  const isAdmin = msg.senderRole === "admin";
                  const showAvatar =
                    index === 0 ||
                    activeConversation.messages![index - 1]?.senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2",
                        isAdmin ? "justify-start" : "justify-end"
                      )}
                    >
                      {isAdmin && showAvatar && (
                        <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          A
                        </div>
                      )}
                      {isAdmin && !showAvatar && <div className="w-7 shrink-0" />}
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                          isAdmin
                            ? "bg-white text-slate-900 rounded-bl-md shadow-sm"
                            : "bg-primary-600 text-white rounded-br-md"
                        )}
                      >
                        {!isAdmin && (
                          <p className="text-[10px] font-medium text-primary-200 mb-1">
                            {msg.senderName || "Người dùng"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div
                          className={cn(
                            "text-[10px] mt-1",
                            isAdmin ? "text-slate-400" : "text-primary-200"
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeConversation.status === "open" ? (
                <div className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn trả lời..."
                      className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || isSending}
                      size="icon"
                      className="bg-primary-600 hover:bg-primary-700 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <p className="text-sm text-slate-400 text-center">
                    Cuộc trò chuyện này đã được đóng
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center">
                Chọn một cuộc trò chuyện để xem
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
