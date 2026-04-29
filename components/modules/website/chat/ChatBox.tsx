"use client";
import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/providers/ChatProvider";
import { X, MessageCircle, Send, ArrowLeft, Minimize2, Bot, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const WELCOME_MESSAGE = "Chào Mừng Khách Hàng Đến Với KhoMaNguon.IO.VN 🎉\n\nMọi chi tiết xin liên hệ — Tôi là trợ lý AI hỗ trợ 24/24.\n\nHãy gửi tin nhắn để được hỗ trợ ngay!";

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
  return date.toLocaleDateString("vi-VN");
}

export default function ChatBox() {
  const { data: session } = useSession();
  const {
    conversations,
    activeConversation,
    unreadTotal,
    isOpen,
    isMinimized,
    isLoading,
    openChat,
    closeChat,
    toggleChat,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    startConversation,
    markAsRead,
  } = useChat();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeConversation?.messages) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (isOpen && activeConversation) {
      scrollToBottom();
    }
  }, [isOpen, activeConversation]);

  // Auto-open chat box after 3 seconds (once per session)
  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem("chat_auto_opened");
    if (alreadyOpened) return;

    const timer = setTimeout(() => {
      openChat();
      setShowConversations(false); // Go straight to welcome message
      sessionStorage.setItem("chat_auto_opened", "1");
    }, 3000);

    return () => clearTimeout(timer);
  }, [openChat]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      if (activeConversation) {
        await sendMessage(activeConversation.id, content);
      } else {
        await startConversation(content);
      }
      setShowConversations(false);
    } catch (error) {
      setMessage(content);
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

  const handleSelectConversation = async (conv: any) => {
    setActiveConversation(conv);
    setShowConversations(false);
    await fetchMessages(conv.id);
  };

  const handleBackToList = () => {
    setShowConversations(true);
    setActiveConversation(null);
  };

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Floating Button Group */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Full Chat Page Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open("/chat", "_blank")}
          className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 shadow-xl flex items-center justify-center transition-all group"
          title="Mở giao diện Nexus Chat"
        >
          <Zap className="w-5 h-5 fill-indigo-400 group-hover:fill-indigo-300" />
        </motion.button>

        {/* Traditional Floating Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleChat}
          className={cn(
            "w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 flex items-center justify-center transition-all duration-300 relative overflow-hidden group",
            unreadTotal > 0 && "ring-4 ring-indigo-500/20"
          )}
          aria-label="Mở chat"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {isOpen && !isMinimized ? (
            <Minimize2 className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              <AnimatePresence>
                {unreadTotal > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-2 border-white text-white text-[10px] rounded-lg flex items-center justify-center font-black shadow-sm"
                  >
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[560px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {(!showConversations || activeConversation) && (
                <button
                  onClick={handleBackToList}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-semibold text-base">
                  {activeConversation
                    ? activeConversation.type === "user_seller"
                      ? `Liên hệ người bán`
                      : "Hỗ trợ Admin"
                    : "Hỗ trợ & Liên hệ"}
                </h3>
                {activeConversation && (
                  <p className="text-xs text-primary-100">
                    {activeConversation.participantName || activeConversation.participantEmail || "Người dùng"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={closeChat}
              className="p-1 hover:bg-primary-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {showConversations && !activeConversation ? (
            /* Conversation List */
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-neutral-100">
                <button
                  onClick={() => setShowConversations(false)}
                  className="w-full py-3 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Bắt đầu cuộc trò chuyện với Admin
                </button>
              </div>
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-6">
                  <MessageCircle className="w-12 h-12 mb-3" />
                  <p className="text-sm text-center">
                    Chưa có cuộc trò chuyện nào.
                    <br />
                    Bắt đầu trò chuyện với chúng tôi!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-neutral-50 transition-colors",
                        conv.unreadCount > 0 && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm shrink-0">
                          {(conv.participantName || conv.participantEmail || "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-neutral-900 truncate">
                              {conv.type === "user_seller" ? "Người bán" : "Admin Hỗ trợ"}
                            </span>
                            <span className="text-xs text-neutral-400 shrink-0 ml-2">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 truncate mt-0.5">
                            {conv.lastMessage || "Chưa có tin nhắn"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : activeConversation?.messages ? (
            /* Messages View */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConversation.messages.map((msg, index) => {
                  const isOwn = msg.senderRole === "admin";
                  const msgs = activeConversation.messages!;
                  const showAvatar =
                    index === 0 ||
                    msgs[index - 1]?.senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id || index}
                      className={cn(
                        "flex items-end gap-2",
                        isOwn ? "justify-start" : "justify-end"
                      )}
                    >
                      {isOwn && showAvatar && (
                        <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          A
                        </div>
                      )}
                      {isOwn && !showAvatar && <div className="w-7 shrink-0" />}
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                          isOwn
                            ? "bg-neutral-100 text-neutral-900 rounded-bl-md"
                            : "bg-primary-600 text-white rounded-br-md"
                        )}
                      >
                        {msg.content}
                        <div
                          className={cn(
                            "text-[10px] mt-1",
                            isOwn ? "text-neutral-400" : "text-primary-200"
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
              {activeConversation.status === "open" && (
                <div className="p-3 border-t border-neutral-100 bg-white">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
                      rows={1}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || isSending}
                      className={cn(
                        "w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 transition-colors",
                        (message.trim() && !isSending)
                          ? "hover:bg-primary-700 cursor-pointer"
                          : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {activeConversation.status === "closed" && (
                <div className="p-3 border-t border-neutral-100 bg-neutral-50">
                  <p className="text-sm text-neutral-400 text-center">
                    Cuộc trò chuyện này đã được đóng
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* New Conversation Form with Welcome Message */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Welcome message area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* AI Welcome Bubble */}
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 text-neutral-800 rounded-bl-md border border-primary-100 shadow-sm">
                    <p className="text-sm font-semibold text-primary-700 mb-1">Trợ lý KhoMaNguon</p>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{WELCOME_MESSAGE}</p>
                    <div className="text-[10px] mt-1.5 text-neutral-400">Vừa xong</div>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="p-3 border-t border-neutral-100 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Nhập tin nhắn để bắt đầu..."
                    className="flex-1 resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                    className={cn(
                      "w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 transition-colors",
                      (message.trim() && !isSending)
                        ? "hover:bg-primary-700 cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
