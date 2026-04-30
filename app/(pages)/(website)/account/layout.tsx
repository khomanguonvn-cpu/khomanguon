
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
    <section className="relative min-h-screen overflow-x-hidden bg-slate-50 py-3 sm:py-5 lg:py-8">
      {/* Accent top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 via-indigo-500 to-orange-500" />

      <Container>
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
          <SidebarAccount user={user} />
          <div className="min-w-0 flex-1 w-full overflow-hidden">{children}</div>
        </div>
      </Container>
    </section>
  );
}
