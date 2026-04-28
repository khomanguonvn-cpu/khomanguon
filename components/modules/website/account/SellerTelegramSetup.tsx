"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

type TelegramConfig = {
  isConfigured: boolean;
  chatId: string;
  botTokenPreview: string;
};

export default function SellerTelegramSetup() {
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/seller/telegram");
      setConfig(res.data?.data || null);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSubmit = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Vui lòng nhập đầy đủ Bot Token và Chat ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/seller/telegram", {
        botToken: botToken.trim(),
        chatId: chatId.trim(),
      });
      toast.success(res.data?.message || "Kích hoạt thành công!");
      setBotToken("");
      setChatId("");
      setShowForm(false);
      await loadConfig();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể kích hoạt Telegram Bot";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Bạn có chắc muốn hủy tích hợp Telegram Bot?")) return;

    try {
      await axios.delete("/api/seller/telegram");
      toast.success("Đã hủy tích hợp Telegram Bot");
      await loadConfig();
    } catch {
      toast.error("Không thể hủy tích hợp");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tích hợp Telegram Bot
            </h2>
            <p className="text-sm text-slate-500">
              Nhận thông báo đơn hàng mới qua Telegram
            </p>
          </div>
        </div>

        {config?.isConfigured ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">
                Đã kích hoạt
              </span>
            </div>
            <div className="text-sm text-emerald-700 space-y-1">
              <p>
                <span className="font-medium">Bot Token:</span>{" "}
                {config.botTokenPreview}
              </p>
              <p>
                <span className="font-medium">Chat ID:</span> {config.chatId}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Send className="h-4 w-4 mr-1" />
                Cập nhật
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDisconnect}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Hủy tích hợp
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                Chưa kích hoạt
              </span>
            </div>
            <p className="text-sm text-amber-700">
              Bạn cần kích hoạt Telegram Bot để nhận thông báo khi có đơn hàng
              mới. Nếu không kích hoạt, bạn vẫn có thể vào trang &quot;Đơn cần
              trả&quot; để kiểm tra.
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <Bot className="h-4 w-4 mr-1" />
              Kích hoạt ngay
            </Button>
          </div>
        )}
      </div>

      {/* Setup Form */}
      {(showForm || (!config?.isConfigured && !loading)) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Cấu hình Telegram Bot
          </h3>

          {/* Step-by-step guide */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-6">
            <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Hướng dẫn từng bước
            </h4>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  1
                </span>
                <span>
                  Mở Telegram, tìm{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    @BotFather
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  và nhấn <strong>Start</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  2
                </span>
                <span>
                  Gõ <code className="bg-slate-200 px-1 rounded">/newbot</code>,
                  đặt tên cho bot (ví dụ: &quot;Cửa hàng của tôi&quot;)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  3
                </span>
                <span>
                  BotFather sẽ gửi cho bạn một <strong>Bot Token</strong> (dạng{" "}
                  <code className="bg-slate-200 px-1 rounded text-xs">
                    123456:ABC-DEF...
                  </code>
                  ). Copy token này.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  4
                </span>
                <span>
                  Mở bot vừa tạo trong Telegram và nhấn <strong>Start</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  5
                </span>
                <span>
                  Tìm{" "}
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    @userinfobot
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  trên Telegram, nhấn Start để lấy <strong>Chat ID</strong> của
                  bạn
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  6
                </span>
                <span>
                  Dán <strong>Bot Token</strong> và <strong>Chat ID</strong> vào
                  form bên dưới rồi bấm &quot;Xác minh & Lưu&quot;
                </span>
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bot Token
              </label>
              <Input
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                value={botToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBotToken(e.target.value)
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                Token bạn nhận từ @BotFather
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Chat ID
              </label>
              <Input
                placeholder="123456789"
                value={chatId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setChatId(e.target.value)
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                ID bạn nhận từ @userinfobot
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {submitting ? "Đang xác minh..." : "Xác minh & Lưu"}
              </Button>
              {config?.isConfigured && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setBotToken("");
                    setChatId("");
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
