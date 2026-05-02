"use client";
import React from "react";
import AuthProvider from "./AuthProvider";
import ToastProvider from "./ToastProvider";
import FramerMotionProvider from "./FramerMotionProvider";
import { ChatProvider } from "./ChatProvider";
import { Provider } from "react-redux";
import store from "@/store/index";
import SettingsHydrator from "@/components/modules/custom/SettingsHydrator";

import FloatingSupport from "@/components/modules/custom/FloatingSupport";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Provider store={store}>
        <SettingsHydrator />
        <FramerMotionProvider>
          <ToastProvider />
          <FloatingSupport />
          <ChatProvider>
            {children}
          </ChatProvider>
        </FramerMotionProvider>
      </Provider>
    </AuthProvider>
  );
}
