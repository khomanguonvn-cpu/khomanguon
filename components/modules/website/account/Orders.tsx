"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  XCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CancelOrder from "./CancelOrder";
import { Order } from "@/types";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { LanguageCode } from "@/store/settingsSlice";
import { t } from "@/lib/i18n";
import type { Column } from "@tanstack/react-table";

type FulfillmentStatus = "fulfilled" | "pending" | "auto_refunded" | "partial";

function getProductFulfillmentStatus(
  product: Record<string, unknown>
): FulfillmentStatus {
  const rawStatus = String(product.fulfillmentStatus || "pending").toLowerCase();
  if (rawStatus === "fulfilled") return "fulfilled";
  if (rawStatus === "auto_refunded") return "auto_refunded";
  return "pending";
}

function getOrderFulfillmentStatus(products: Order["products"]): FulfillmentStatus {
  if (!products || products.length === 0) return "pending";

  const statuses = products.map((product) =>
    getProductFulfillmentStatus(product as Record<string, unknown>)
  );

  const hasPending = statuses.includes("pending");
  const hasFulfilled = statuses.includes("fulfilled");
  const hasRefunded = statuses.includes("auto_refunded");

  if (hasPending) return "pending";
  if (hasFulfilled && hasRefunded) return "partial";
  if (hasFulfilled) return "fulfilled";
  if (hasRefunded) return "auto_refunded";
  return "pending";
}

function getFulfillmentBadge(status: FulfillmentStatus, language: LanguageCode) {
  if (status === "fulfilled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3 w-3" />
        {t(language, "orderFulfilled")}
      </span>
    );
  }

  if (status === "auto_refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <XCircle className="h-3 w-3" />
        {t(language, "orderRefunded")}
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 whitespace-nowrap">
        <AlertTriangle className="h-3 w-3" />
        {t(language, "orderPartialFulfillment")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
      <Clock className="h-3 w-3" />
      {t(language, "orderPendingFulfillment")}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function getOrderItemsSummary(products: Order["products"], language: LanguageCode) {
  if (!products || products.length === 0) return "—";

  if (products.length === 1) {
    const status = getProductFulfillmentStatus(
      products[0] as Record<string, unknown>
    );
    return getFulfillmentBadge(status, language);
  }

  const fulfilled = products.filter(
    (product) =>
      getProductFulfillmentStatus(product as Record<string, unknown>) === "fulfilled"
  ).length;

  const pending = products.filter(
    (product) =>
      getProductFulfillmentStatus(product as Record<string, unknown>) === "pending"
  ).length;

  const refunded = products.filter(
    (product) =>
      getProductFulfillmentStatus(product as Record<string, unknown>) ===
      "auto_refunded"
  ).length;

  return (
    <div className="flex flex-wrap gap-1">
      {fulfilled > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-2.5 w-2.5" />
          {fulfilled} {t(language, "walletFulfilledUnit")}
        </span>
      )}
      {pending > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          <Clock className="h-2.5 w-2.5" />
          {pending} {t(language, "walletPendingUnit")}
        </span>
      )}
      {refunded > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          <XCircle className="h-2.5 w-2.5" />
          {refunded} {t(language, "walletRefundedUnit")}
        </span>
      )}
    </div>
  );
}

export const columnsFactory = (language: LanguageCode): ColumnDef<Order>[] =>
  [
    {
      accessorKey: "_id",
      header: t(language, "orderCodeId"),
      cell: ({ row }) => (
        <div className="font-mono text-sm font-semibold text-indigo-600">
          #{row.getValue("_id")}
        </div>
      ),
    },

    {
      accessorKey: "createdAt",
      header: ({ column }: { column: Column<Order, unknown> }) => (
        <button
          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(language, "orderDatePlaced")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-slate-600 whitespace-nowrap">
          {formatDate(row.getValue("createdAt"))}
        </div>
      ),
    },

    {
      id: "products",
      header: t(language, "orderProductsOrdered"),
      cell: ({ row }) => {
        const products = row.original.products;
        if (!products || products.length === 0) {
          return <span className="text-slate-400 text-sm">—</span>;
        }
        if (products.length === 1) {
          const product = products[0];
          return (
            <div className="max-w-[260px]">
              <p className="text-sm font-medium text-slate-800 truncate" title={product.name}>
                {product.name}
              </p>
              <p className="text-xs text-slate-400">x{product.qty}</p>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <div className="max-w-[240px]">
              <p className="text-sm font-medium text-slate-800 truncate" title={products[0].name}>
                {products[0].name}
              </p>
              <p className="text-xs text-slate-400">
                +{products.length - 1} {t(language, "orderOtherProducts")}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      id: "fulfillmentStatus",
      header: t(language, "orderFulfillmentStatus"),
      cell: ({ row }) => {
        const products = row.original.products;
        return <div className="min-w-[120px]">{getOrderItemsSummary(products, language)}</div>;
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;
        const shippingStatus = String(order.shippingStatus || "").toLowerCase();

        return (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(order._id);
                toast.success(t(language, "orderCopiedOrderId"));
              }}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title={t(language, "orderCopyCode")}
            >
              <Copy className="h-4 w-4" />
            </button>

            <Link
              href={`/order/${order._id}`}
              className="p-1.5 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
              title={t(language, "orderViewDetail")}
            >
              <Eye className="h-4 w-4" />
            </Link>

            {(shippingStatus === "pending_handover" ||
              shippingStatus === "not processed" ||
              shippingStatus === "pending") && <CancelOrder item={order} />}
          </div>
        );
      },
    },
  ] as ColumnDef<Order>[];

export default function Orders({ data }: { data: Order[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const { language } = useSelector((state: IRootState) => state.settings) as { language: LanguageCode };

  const columns = React.useMemo(() => columnsFactory(language), [language]);

  const orderStats = React.useMemo(
    () =>
      data.reduce(
        (acc, order) => {
          const status = getOrderFulfillmentStatus(order.products);
          if (status === "fulfilled") {
            acc.fulfilled += 1;
          } else if (status === "auto_refunded") {
            acc.refunded += 1;
          } else if (status === "partial") {
            acc.partial += 1;
          } else {
            acc.pending += 1;
          }
          return acc;
        },
        {
          fulfilled: 0,
          pending: 0,
          refunded: 0,
          partial: 0,
        }
      ),
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3 py-4 flex-wrap">
        <Input
          placeholder={t(language, "orderSearchPlaceholder")}
          value={(table.getColumn("_id")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("_id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              {t(language, "tableColumns")} <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value: boolean) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id === "fulfillmentStatus"
                    ? t(language, "orderFulfillmentStatus")
                    : column.id === "createdAt"
                    ? t(language, "orderDatePlaced")
                    : column.id === "products"
                    ? t(language, "orderProductsOrdered")
                    : column.id === "_id"
                    ? t(language, "orderCodeId")
                    : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-wrap w-full items-center gap-2 sm:gap-3 text-[10px] sm:text-xs lg:ml-auto lg:w-auto">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            {orderStats.fulfilled} {t(language, "walletFulfilledUnit")}
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Clock className="h-3 w-3" />
            {orderStats.pending} {t(language, "walletPendingUnit")}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" />
            {orderStats.refunded} {t(language, "walletRefundedUnit")}
          </span>
          {orderStats.partial > 0 && (
            <span className="flex items-center gap-1 text-violet-600">
              <AlertTriangle className="h-3 w-3" />
              {orderStats.partial} {t(language, "orderPartialFulfillment")}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table className="min-w-[760px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-slate-700 text-sm">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-400"
                >
                  {t(language, "orderNoOrders")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-4 px-1">
        <p className="text-sm text-slate-500">
          {t(language, "displayLabel")}{" "}
          <strong className="text-slate-700">
            {table.getRowModel().rows.length}
          </strong>{" "}
          / {data.length} {t(language, "orderUnit")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t(language, "tablePrevious")}
          </button>
          <span className="text-sm text-slate-600 px-2">
            {t(language, "sellerPage")} {table.getState().pagination.pageIndex + 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t(language, "tableNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
