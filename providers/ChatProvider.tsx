"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

export interface ChatMessage {
  id?: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatConversation {
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

interface ChatContextType {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  unreadTotal: number;
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveConversation: (conv: ChatConversation | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  startConversation: (message: string, participantName?: string, participantEmail?: string) => Promise<void>;
  sendSellerMessage: (sellerId: number, productId: number, message: string) => Promise<void>;
  markAsRead: (conversationId: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Generate a short notification beep using Web Audio API.
 * Falls back silently if audio is not available.
 */
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First tone (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second tone (even higher - pleasant ding)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.35);

    // Cleanup
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available — silently skip
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<ChatConversation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<number>(0);
  const userRoleRef = useRef<string>("user");
  const prevUnreadRef = useRef<number>(0);
  const prevMessageCountRef = useRef<number>(0);

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Play sound when unread count increases (new message from admin/seller)
  useEffect(() => {
    if (unreadTotal > prevUnreadRef.current && prevUnreadRef.current >= 0) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadTotal;
  }, [unreadTotal]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get("/api/chat");
      if (res.data.conversations) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/chat/${conversationId}`);
      if (res.data.conversation && res.data.messages) {
        const convWithMessages = {
          ...res.data.conversation,
          messages: res.data.messages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? convWithMessages : c))
        );
        setActiveConversationState(convWithMessages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: number, content: string) => {
    try {
      const res = await axios.post(`/api/chat/${conversationId}`, { content });
      if (res.data.messages) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              const lastMsg = res.data.messages[res.data.messages.length - 1];
              return {
                ...c,
                lastMessage: lastMsg.content,
                lastMessageAt: lastMsg.createdAt,
                messages: res.data.messages,
              };
            }
            return c;
          })
        );
        if (activeConversation?.id === conversationId) {
          const lastMsg = res.data.messages[res.data.messages.length - 1];
          setActiveConversationState((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: lastMsg.content,
                  lastMessageAt: lastMsg.createdAt,
                  messages: res.data.messages,
                }
              : null
          );
        }
      } else if (res.data.message) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: content,
                lastMessageAt: new Date().toISOString(),
                messages: [...(c.messages || []), res.data.message],
              };
            }
            return c;
          })
        );
        if (activeConversation?.id === conversationId) {
          setActiveConversationState((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: content,
                  lastMessageAt: new Date().toISOString(),
                  messages: [...(prev.messages || []), res.data.message],
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      throw new Error("Failed to send message");
    }
  }, [activeConversation]);

  const startConversation = useCallback(async (
    message: string,
    participantName?: string,
    participantEmail?: string
  ) => {
    try {
      const res = await axios.post("/api/chat", {
        message,
        participantName: participantName || "",
        participantEmail: participantEmail || "",
      });
      if (res.data.conversation) {
        const newConv = {
          ...res.data.conversation,
          messages: res.data.messages || res.data.conversation.messages || [],
        };
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === newConv.id);
          if (existing) return prev;
          return [newConv, ...prev];
        });
        setActiveConversationState(newConv);
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
      throw new Error("Failed to start conversation");
    }
  }, []);

  const sendSellerMessage = useCallback(async (
    sellerId: number,
    productId: number,
    message: string
  ) => {
    try {
      const res = await axios.post("/api/seller/chat", {
        sellerId,
        productId,
        message,
      });
      if (res.data.conversation) {
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === res.data.conversation.id);
          if (existing) return prev;
          return [res.data.conversation, ...prev];
        });
        setActiveConversationState(res.data.conversation);
      }
    } catch (err) {
      console.error("Error sending seller message:", err);
      throw new Error("Failed to send message to seller");
    }
  }, []);

  const markAsRead = useCallback((conversationId: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
    if (activeConversation?.id === conversationId) {
      setActiveConversationState((prev) =>
        prev ? { ...prev, unreadCount: 0 } : null
      );
    }
  }, [activeConversation]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setActiveConversationState(null);
  }, []);

  const toggleChat = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  }, [isOpen, isMinimized]);

  const setActiveConversation = useCallback((conv: ChatConversation | null) => {
    setActiveConversationState(conv);
    if (conv) {
      markAsRead(conv.id);
    }
  }, [markAsRead]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const sessionRes = await axios.get("/api/auth/session");
        const user = sessionRes.data?.user;
        if (user) {
          userIdRef.current = Number(user.id || 0);
          userRoleRef.current = String(user.role || "user");
          await fetchConversations();
        }
      } catch {
        // Unauthenticated or session error — skip silently
      }
    };
    initChat();
  }, [fetchConversations]);

  // Poll for new messages in active conversation + play sound on new incoming messages
  useEffect(() => {
    if (!isOpen || !activeConversation) return;

    // Track current message count for sound detection
    prevMessageCountRef.current = activeConversation.messages?.length || 0;

    const pollMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/${activeConversation.id}`);
        if (res.data.messages) {
          const newMessages: ChatMessage[] = res.data.messages;
          const oldCount = prevMessageCountRef.current;

          // Check if there are new messages from someone else (admin/seller)
          if (newMessages.length > oldCount) {
            const latestNew = newMessages.slice(oldCount);
            const hasIncoming = latestNew.some(
              (m) => m.senderId !== userIdRef.current
            );
            if (hasIncoming) {
              playNotificationSound();
            }
          }
          prevMessageCountRef.current = newMessages.length;

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversation.id
                ? { ...c, messages: newMessages }
                : c
            )
          );
          setActiveConversationState((prev) =>
            prev && prev.id === activeConversation.id
              ? { ...prev, messages: newMessages }
              : prev
          );
        }
      } catch {
        // Silently skip polling errors (e.g. 401 on auth expiry)
      }
    };

    pollingRef.current = setInterval(pollMessages, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, activeConversation?.id]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        unreadTotal,
        isOpen,
        isMinimized,
        isLoading,
        error,
        openChat,
        closeChat,
        toggleChat,
        setActiveConversation,
        fetchConversations,
        fetchMessages,
        sendMessage,
        startConversation,
        sendSellerMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
