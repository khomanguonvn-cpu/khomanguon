"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Copy } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
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
import { Address as TAddress } from "@/types";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import ModalDeleteAddress from "./ModalDeleteAddress";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function Address({ data }: { data: TAddress[] }) {
  const { language } = useSelector((state: IRootState) => state.settings);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<TAddress>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: { table: any }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value: boolean) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t(language, "tableSelectAll")}
          />
        ),
        cell: ({ row }: { row: any }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label={t(language, "tableSelectRow")}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },

      {
        accessorKey: "_id",
        header: t(language, "tableId"),
        cell: ({ row }: { row: any }) => (
          <div className="capitalize">{row.getValue("_id")}</div>
        ),
      },

      {
        accessorKey: "address",
        header: ({ column }: { column: any }) => {
          return (
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {t(language, "tableAddress")}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </button>
          );
        },
        cell: ({ row }: { row: any }) => (
          <div className="lowercase">{row.getValue("address")}</div>
        ),
      },

      {
        accessorKey: "phoneNumber",
        header: t(language, "tablePhoneNumber"),
        cell: ({ row }: { row: any }) => (
          <div className="capitalize">{row.getValue("phoneNumber")}</div>
        ),
      },

      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }: { row: any }) => {
          const address = row.original;
          return (
            <div className="flex items-center gap-10 justify-end">
              <div
                onClick={() => {
                  navigator.clipboard.writeText(address._id);
                  toast(t(language, "toastCopied"));
                }}
              >
                <Copy />
              </div>

              <div>
                <ModalDeleteAddress item={address} />
              </div>
            </div>
          );
        },
      },
    ],
    [language]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder={t(language, "tableFilterPlaceholder")}
          value={(table.getColumn("_id")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("_id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto">
              {t(language, "tableColumns")}{" "}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value: boolean) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  {t(language, "tableNoResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length}{" "}
          {t(language, "tableRowsSelected")}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t(language, "tablePrevious")}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t(language, "tableNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
