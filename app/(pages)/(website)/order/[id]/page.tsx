
import auth from "@/auth";
import Container from "@/components/modules/custom/Container";
import OrderWrapper from "@/components/modules/website/order/OrderWrapper";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    status?: string;
  }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <>
      <section className="mt-10">
        <Container>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link href="/">Trang chủ</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Link href="/account/dashboard">Tài khoản</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/account/order">Đơn hàng</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">{id}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Container>
      </section>
      <OrderWrapper id={id} paymentStatus={resolvedSearchParams.status} />
    </>
  );
}

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng - KHOMANGUON",
  description: "Theo dõi trạng thái và thông tin bàn giao sản phẩm số",
  icons: {
    icon: "/assets/images/logo.svg",
  },
};
