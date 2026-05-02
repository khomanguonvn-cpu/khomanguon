"use client";
import React from "react";
import dynamic from "next/dynamic";

const ToasterNoSSR = dynamic(() => import("react-hot-toast").then((mod) => mod.Toaster), {
  ssr: false,
});

export default function ToastProvider() {
  return (
    <div suppressHydrationWarning>
      <ToasterNoSSR
        position="top-center"
        gutter={10}
        containerStyle={{
          top: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "420px",
            border: "1px solid #f1f5f9"
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </div>
  );
}
