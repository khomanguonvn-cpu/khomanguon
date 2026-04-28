// Here website layout
import MobileBottom from "@/components/modules/custom/MobileBottom";
import Footer from "@/components/modules/website/footer";
import Header from "@/components/modules/website/header";
import ChatBox from "@/components/modules/website/chat/ChatBox";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MobileBottom />
      <div className="pb-20 lg:pb-0">
        {children}
      </div>
      <Footer />
      <ChatBox />
    </>
  );
}
