"use client";
import React, { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChat } from "@/providers/ChatProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ContactSellerProps {
  sellerId: number;
  sellerName?: string;
  productId: number;
  productName?: string;
  className?: string;
}

export default function ContactSeller({
  sellerId,
  sellerName,
  productId,
  productName,
  className,
}: ContactSellerProps) {
  const { data: session } = useSession();
  const { openChat, setActiveConversation } = useChat();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendSellerMessage } = useChat();

  if (!session) {
    return null;
  }

  const handleOpenModal = () => {
    setIsOpenModal(true);
    setMessage(
      productName
        ? `Xin chào, tôi quan tâm đến sản phẩm: ${productName}`
        : "Xin chào, tôi quan tâm đến sản phẩm này."
    );
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
    setMessage("");
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Vui lòng nhập tin nhắn");
      return;
    }

    setIsSending(true);
    try {
      await sendSellerMessage(sellerId, productId, message);
      toast.success("Đã gửi tin nhắn cho người bán!");
      handleCloseModal();
      openChat();
    } catch (error) {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="lg"
        className={cn(
          "gap-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-700 w-full sm:w-auto",
          className
        )}
      >
        <MessageCircle className="w-5 h-5" />
        Liên hệ người bán
      </Button>

      {/* Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary-600 text-white px-6 py-4">
              <h3 className="font-semibold text-lg">
                Liên hệ người bán
              </h3>
              {sellerName && (
                <p className="text-primary-100 text-sm mt-0.5">
                  Gửi tin nhắn đến: {sellerName}
                </p>
              )}
            </div>

            <div className="p-6">
              {productName && (
                <div className="bg-neutral-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-neutral-500 mb-1">Sản phẩm quan tâm</p>
                  <p className="text-sm font-medium text-neutral-900 line-clamp-2">
                    {productName}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Tin nhắn của bạn
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSending}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                    className="flex-1 gap-2 bg-primary-600 hover:bg-primary-700"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Gửi tin nhắn
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
