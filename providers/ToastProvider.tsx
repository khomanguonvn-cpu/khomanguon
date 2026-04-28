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
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            maxWidth: "420px",
          },
          success: {
            duration: 3000,
            style: {
              background: "transparent",
              boxShadow: "none",
              padding: 0,
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "transparent",
              boxShadow: "none",
              padding: 0,
            },
          },
        }}
      />
    </div>
  );
}
