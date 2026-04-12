"use client";

import React, { useState } from "react";
import {
  useAdminSuppliers, useAdminApproveSupplier, useAdminRejectSupplier, useAdminDeleteSupplier,
  useAdminSupplierApplications, type Supplier,
} from "@/hooks/use-admin-tenders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Eye, Trash2, Package, CheckCircle, XCircle, Loader2, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function ViewSupplierModal({ supplier, open, onClose }: { supplier: Supplier | null; open: boolean; onClose: () => void }) {
  if (!supplier) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">{supplier.company_name}</DialogTitle>
          <p className="text-[12px] text-gray-400">{supplier.industry} · {supplier.city}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Status", value: <Badge className={cn("text-[11px] border", STATUS_STYLES[(supplier.status || "")] ?? "")}>{(supplier.status || "").replace(/_/g," ")}</Badge> },
                { label: "Verified", value: supplier.is_verified ? "Yes" : "No" },
                { label: "Category", value: supplier.category || "—" },
                { label: "Phone", value: supplier.phone || "—" },
                { label: "Email", value: supplier.email || "—" },
                { label: "Website", value: supplier.website || "—" },
                { label: "Joined", value: format(new Date(supplier.created_at), "dd MMM yyyy") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <div className="text-gray-800 font-medium">{value as React.ReactNode}</div>
                </div>
              ))}
            </div>
            {supplier.description && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">About</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{supplier.description}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-[13px]">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuppliersTable({ suppliers, isLoading, onView, onApprove, onReject, onDelete }: {
  suppliers: Supplier[];
  isLoading: boolean;
  onView: (s: Supplier) => void;
  onApprove: (s: Supplier) => void;
  onReject: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}) {
  return (
    <div className="border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold text-gray-700 text-[12px]">Supplier</TableHead>
            <TableHead className="font-semibold text-gray-700 text-[12px]">Industry</TableHead>
            <TableHead className="font-semibold text-gray-700 text-[12px]">City</TableHead>
            <TableHead className="font-semibold text-gray-700 text-[12px]">Joined</TableHead>
            <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? [...Array(4)].map((_, i) => (
            <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
          )) : suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                No suppliers found
              </TableCell>
            </TableRow>
          ) : suppliers.map(s => (
            <TableRow key={s.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-gray-100 flex items-center justify-center shrink-0 rounded"><Package className="h-3 w-3 text-gray-400" /></div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{s.company_name}</p>
                    {s.is_verified && <ShieldCheck className="h-3 w-3 text-blue-500 inline" />}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-[13px] text-gray-500">{s.industry || "—"}</TableCell>
              <TableCell className="text-[13px] text-gray-500">{s.city || "—"}</TableCell>
              <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
              <TableCell>
                <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[s.status] ?? "")}>{(s.status || "active").replace(/_/g," ")}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onView(s)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                    {s.status !== "active" && (
                      <DropdownMenuItem onClick={() => onApprove(s)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Approve</span>
                      </DropdownMenuItem>
                    )}
                    {s.status === "active" && (
                      <DropdownMenuItem onClick={() => onReject(s)}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        <span className="text-red-700">Reject</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(s)}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminSuppliersPage() {
  const [tab, setTab] = useState("suppliers");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { data: suppliersData, isLoading: suppliersLoading } = useAdminSuppliers({ page, page_size: 20, search });
  const { data: appsData, isLoading: appsLoading } = useAdminSupplierApplications({ page, page_size: 20, status: "pending" });
  const approveMutation = useAdminApproveSupplier();
  const rejectMutation = useAdminRejectSupplier();
  const deleteMutation = useAdminDeleteSupplier();

  const suppliers = suppliersData?.data ?? [];
  const apps = appsData?.data ?? [];
  const totalPages = (tab === "suppliers" ? suppliersData?.total_pages : appsData?.total_pages) ?? 1;

  const handleApprove = (s: Supplier) => approveMutation.mutate(s.id);
  const handleReject = (s: Supplier) => rejectMutation.mutate({ id: s.id });
  const handleDelete = (s: Supplier) => { setDeletingSupplier(s); setDeleteOpen(true); };
  const confirmDelete = () => {
    if (!deletingSupplier) return;
    deleteMutation.mutate(deletingSupplier.id, { onSuccess: () => { setDeleteOpen(false); setDeletingSupplier(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Suppliers</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage registered and applying suppliers</p>
      </div>
      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(1); }}>
        <TabsList className="h-9 text-[13px]">
          <TabsTrigger value="suppliers" className="text-[13px]">All Suppliers</TabsTrigger>
          <TabsTrigger value="applications" className="text-[13px]">Applications ({appsData?.total_items ?? 0})</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search suppliers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px] max-w-sm" />
          </div>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{tab === "suppliers" ? "Supplier Registry" : "Pending Applications"}</CardTitle>
              <CardDescription className="text-xs">{tab === "suppliers" ? suppliersData?.total_items : appsData?.total_items} total</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <TabsContent value="suppliers" className="mt-0">
                <SuppliersTable suppliers={suppliers} isLoading={suppliersLoading} onView={s => { setViewingSupplier(s); setViewOpen(true); }} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="applications" className="mt-0">
                <SuppliersTable suppliers={apps} isLoading={appsLoading} onView={s => { setViewingSupplier(s); setViewOpen(true); }} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
              </TabsContent>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
      <ViewSupplierModal supplier={viewingSupplier} open={viewOpen} onClose={() => setViewOpen(false)} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingSupplier(null); }} onConfirm={confirmDelete} title="Delete Supplier" itemName={deletingSupplier?.company_name} isLoading={deleteMutation.isPending} />
    </div>
  );
}
