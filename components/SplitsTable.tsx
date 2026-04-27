"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SplitRow } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/formatters";

const traditionalColumns: ColumnDef<SplitRow>[] = [
  { accessorKey: "segment", header: "Segment" },
  { accessorKey: "posts", header: "Posts" },
  { accessorKey: "views", header: "Views", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "likes", header: "Likes", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "comments", header: "Comments", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "replies", header: "Replies", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "reposts", header: "Reposts", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "quotes", header: "Quotes", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "shares", header: "Shares", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "signups", header: "Signups", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "paid", header: "Paid", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "consulting", header: "Consulting", cell: ({ getValue }) => formatNumber(getValue<number>()) },
  { accessorKey: "revenue", header: "Revenue", cell: ({ getValue }) => formatCurrency(getValue<number>()) },
];

const advancedColumns: ColumnDef<SplitRow>[] = [
  { accessorKey: "segment", header: "Segment" },
  { accessorKey: "surfaceIQ", header: "Surface IQ", cell: ({ getValue }) => getValue<number>().toFixed(1) },
  { accessorKey: "socialTS", header: "Social TS%", cell: ({ getValue }) => getValue<number>().toFixed(1) },
  { accessorKey: "signupRate", header: "Signup Rate", cell: ({ getValue }) => `${getValue<number>().toFixed(2)}%` },
  { accessorKey: "paidConversionRate", header: "Paid Conv.", cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%` },
  { accessorKey: "consultingIntentRate", header: "Consulting Intent", cell: ({ getValue }) => `${getValue<number>().toFixed(2)}%` },
  { accessorKey: "assistRate", header: "Assist Rate", cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%` },
  { accessorKey: "ctaEfficiency", header: "CTA Efficiency", cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%` },
  { accessorKey: "trustGravity", header: "Trust Gravity", cell: ({ getValue }) => getValue<number>().toFixed(1) },
  { accessorKey: "humanHalo", header: "Human Halo", cell: ({ getValue }) => getValue<number>().toFixed(1) },
  { accessorKey: "revenuePerPost", header: "Revenue/Post", cell: ({ getValue }) => formatCurrency(getValue<number>()) },
  { accessorKey: "conversionPer1KViews", header: "Conv./1K Views", cell: ({ getValue }) => getValue<number>().toFixed(2) },
  { accessorKey: "diffusionDepth", header: "Diffusion Depth", cell: ({ getValue }) => getValue<number>().toFixed(1) },
];

export function SplitsTable({ rows }: { rows: SplitRow[] }) {
  return (
    <Tabs defaultValue="traditional">
      <TabsList>
        <TabsTrigger value="traditional" data-testid="splits-tab-traditional">
          Traditional
        </TabsTrigger>
        <TabsTrigger value="advanced" data-testid="splits-tab-advanced">
          Advanced
        </TabsTrigger>
      </TabsList>
      <TabsContent value="traditional">
        <DataTable columns={traditionalColumns} rows={rows} />
      </TabsContent>
      <TabsContent value="advanced">
        <DataTable columns={advancedColumns} rows={rows} />
      </TabsContent>
    </Tabs>
  );
}

function DataTable({ columns, rows }: { columns: ColumnDef<SplitRow>[]; rows: SplitRow[] }) {
  // TanStack Table intentionally returns stateful helpers; this is the documented API boundary.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
