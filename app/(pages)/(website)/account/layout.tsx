import { getUserById } from "@/actions/user";
import auth from "@/auth";
import Container from "@/components/modules/custom/Container";
import SidebarAccount from "@/components/modules/website/account/SidebarAccount";
import { redirect } from "next/navigation";
import React from "react";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = await getUserById(session?.user?.id);
  if (!session) {
    redirect("/");
  }

  return (
    <section className="relative min-h-screen overflow-x-hidden border-t border-slate-200 bg-gradient-to-br from-slate-50 via-white to-primary-50/40 py-6 pb-24 sm:py-8 lg:pb-12">
      <Container>
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
          <SidebarAccount user={user} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </section>
  );
}
