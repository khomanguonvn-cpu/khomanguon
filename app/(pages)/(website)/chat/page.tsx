"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@/providers/ChatProvider";
import { useSession } from "next-auth/react";
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  ChevronLeft,
  Settings,
  MoreVertical,
  Paperclip,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function StandaloneChatPage() {
  const { data: session } = useSession();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    startConversation,
    isLoading
  } = useChat();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto select first user_admin conversation if none active
    if (conversations.length > 0 && !activeConversation) {
      const adminConv = conversations.find(c => c.type === "user_admin");
      if (adminConv) {
        setActiveConversation(adminConv);
        fetchMessages(adminConv.id);
      }
    }
  }, [conversations, activeConversation, setActiveConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

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
    } catch (error) {
      setMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar - Conversations list */}
      <div className="hidden md:flex flex-col w-80 border-r border-slate-800/50 bg-slate-900/40 backdrop-blur-xl z-10">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Nexus Chat
            </h1>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Conversations
          </div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversation(conv);
                fetchMessages(conv.id);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group",
                activeConversation?.id === conv.id
                  ? "bg-indigo-600/10 border border-indigo-500/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 border border-transparent"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105",
                  activeConversation?.id === conv.id
                    ? "bg-gradient-to-tr from-indigo-500 to-blue-400 text-white"
                    : "bg-slate-800 text-slate-500"
                )}>
                  {conv.type === "user_seller" ? <User className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={cn(
                    "font-semibold text-sm truncate",
                    activeConversation?.id === conv.id ? "text-white" : "text-slate-300"
                  )}>
                    {conv.type === "user_seller" ? "Seller Support" : "AI KHOMANGUON"}
                  </span>
                  <span className="text-[10px] text-slate-500">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <p className="text-xs truncate text-slate-500 font-medium">
                  {conv.lastMessage || "No messages yet"}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-600">No active chats found</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
               {session?.user?.image ? (
                 <img src={session.user.image} alt="" className="w-full h-full object-cover" />
               ) : (
                 session?.user?.name?.[0] || "U"
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{session?.user?.name || "Guest"}</p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-20 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <button className="md:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    {activeConversation.type === "user_seller" ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeConversation.type === "user_seller" ? "Seller Support" : "AI KHOMANGUON"}
                    {activeConversation.type !== "user_seller" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] rounded-full font-bold tracking-wider border border-indigo-500/30 uppercase">
                        <Sparkles className="w-3 h-3" /> AI Powered
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    Online • Typically replies in seconds
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-2.5 hover:bg-slate-800/80 rounded-xl transition-all text-slate-400 border border-transparent hover:border-slate-700">
                   <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <Zap className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">End-to-end Encrypted Nexus</p>
                <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent mt-4" />
              </div>

              {activeConversation.messages?.map((msg, index) => {
                const isAI = msg.senderRole === "admin";
                const isSystem = msg.senderId === 0;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || index}
                    className={cn(
                      "flex gap-4",
                      isAI ? "flex-row" : "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      isAI 
                        ? "bg-slate-800 border border-slate-700 text-indigo-400" 
                        : "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white"
                    )}>
                      {isAI ? (isSystem ? <Bot className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />) : <User className="w-5 h-5" />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] md:max-w-[70%]",
                      isAI ? "items-start" : "items-end"
                    )}>
                      <div className={cn(
                        "px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed relative",
                        isAI 
                          ? "bg-slate-800/80 backdrop-blur-md text-slate-200 border border-slate-700/50 rounded-tl-sm shadow-xl" 
                          : "bg-indigo-600 text-white rounded-tr-sm shadow-lg shadow-indigo-600/10"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold mt-2 px-1 uppercase tracking-wider">
                        {isAI ? "AI KHOMANGUON" : "You"} • {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-transparent">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl blur-md opacity-20 group-focus-within:opacity-40 transition-opacity" />
                <div className="relative flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl focus-within:border-indigo-500/50 transition-all">
                  <button className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <textarea
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message AI KHOMANGUON..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 py-3 text-base resize-none"
                  />
                  <button className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hidden sm:block">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                    className={cn(
                      "p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg",
                      message.trim() && !isSending
                        ? "bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30"
                        : "bg-slate-800 text-slate-600 grayscale pointer-events-none"
                    )}
                  >
                    <Send className={cn("w-5 h-5", isSending && "animate-pulse")} />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-4 opacity-50">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
             <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 animate-pulse">
                <Bot className="w-12 h-12 text-white" />
             </div>
             <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Nexus Central</h2>
             <p className="text-slate-500 max-w-sm text-lg font-medium leading-relaxed">
               Welcome to the future of commerce support. Select a thread or start a new high-speed AI sync.
             </p>
             <button 
               onClick={() => startConversation("Hello!")}
               className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
             >
                Initialize New Sync
             </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
