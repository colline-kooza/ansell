"use client";

import React, { useState } from "react";
import {
  useAdminCompanies, useAdminApproveCompany, useAdminRejectCompany,
  useAdminDeleteCompany, useAdminFeatureCompany, type Company,
} from "@/hooks/use-companies";
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
  Search, MoreHorizontal, Eye, Trash2, Building, CheckCircle,
  XCircle, Star, StarOff, Globe, Loader2, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-gray-50 text-gray-600 border-gray-200",
};

function ViewCompanyModal({ company, open, onClose }: { company: Company | null; open: boolean; onClose: () => void }) {
  if (!company) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">{company.company_name}</DialogTitle>
          <p className="text-[12px] text-gray-400">{company.industry} · {company.city}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo_url} alt={company.company_name} className="h-12 w-12 object-contain border border-gray-200" />
              ) : (
                <div className="h-12 w-12 bg-gray-200 flex items-center justify-center rounded">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{company.company_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={cn("text-[11px] border", STATUS_STYLES[company.status] ?? "")}>{(company.status || "").replace(/_/g, " ")}</Badge>
                  {company.is_verified && <Badge className="text-[11px] border bg-blue-50 text-blue-700 border-blue-200"><ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Industry", value: company.industry || "—" },
                { label: "Size", value: company.size || "—" },
                { label: "City", value: company.city || "—" },
                { label: "Phone", value: company.phone || "—" },
                { label: "Email", value: company.email || "—" },
                { label: "Jobs", value: company.jobs_count || 0 },
                { label: "Founded", value: company.founded_year || "—" },
                { label: "Registered", value: format(new Date(company.created_at), "dd MMM yyyy") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
            {company.description && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">About</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{company.description}</p>
              </div>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-primary hover:underline">
                <Globe className="h-3.5 w-3.5" />{company.website}
              </a>
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

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const { data, isLoading } = useAdminCompanies({ page, page_size: 20, search, status });
  const approveMutation = useAdminApproveCompany();
  const rejectMutation = useAdminRejectCompany();
  const deleteMutation = useAdminDeleteCompany();
  const featureMutation = useAdminFeatureCompany();

  const companies = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const anyLoading = approveMutation.isPending || rejectMutation.isPending || featureMutation.isPending;

  const confirmDelete = () => {
    if (!deletingCompany) return;
    deleteMutation.mutate(deletingCompany.id, {
      onSuccess: () => { setDeleteOpen(false); setDeletingCompany(null); },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Companies</h1>
        <p className="text-xs text-gray-500 mt-0.5">All registered companies on the platform</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search companies..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {[{ value: "all", label: "All Statuses" }, { value: "pending_review", label: "Pending Review" }, { value: "active", label: "Active" }, { value: "rejected", label: "Rejected" }]
              .map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Company Registry</CardTitle>
          <CardDescription className="text-xs">{totalItems} total companies</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Industry</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">City</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Jobs</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Registered</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <Building className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map(company => {
                    const isRowLoading =
                      (approveMutation.isPending && approveMutation.variables === company.id) ||
                      (rejectMutation.isPending && rejectMutation.variables?.id === company.id) ||
                      (featureMutation.isPending && featureMutation.variables === company.id) ||
                      (deleteMutation.isPending && deletingCompany?.id === company.id);
                    return (
                      <TableRow key={company.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {company.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={company.logo_url} alt={company.company_name} className="h-7 w-7 object-contain border border-gray-100 shrink-0" />
                            ) : (
                              <div className="h-7 w-7 bg-gray-100 flex items-center justify-center shrink-0">
                                <Building className="h-3.5 w-3.5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900 max-w-[160px] truncate">{company.company_name}</p>
                              {company.is_verified && <ShieldCheck className="h-3 w-3 text-blue-500 inline mt-0.5" />}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500">{company.industry || "—"}</TableCell>
                        <TableCell className="text-[13px] text-gray-500">{company.city || "—"}</TableCell>
                        <TableCell className="text-[13px] text-gray-500">{company.jobs_count || 0}</TableCell>
                        <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(company.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[company.status] ?? "")}>{(company.status || "active").replace(/_/g, " ")}</Badge>
                          {company.is_featured && <Badge className="ml-1 text-[11px] bg-yellow-50 text-yellow-700 border-yellow-200 border"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isRowLoading ? (
                            <div className="flex justify-end p-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={anyLoading}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setViewingCompany(company); setViewOpen(true); }}>
                                  <Eye className="mr-2 h-4 w-4" />View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {company.status !== "active" && (
                                  <DropdownMenuItem onClick={() => approveMutation.mutate(company.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-700">Approve</span>
                                  </DropdownMenuItem>
                                )}
                                {company.status === "active" && (
                                  <DropdownMenuItem onClick={() => rejectMutation.mutate({ id: company.id })}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    <span className="text-red-700">Reject</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => featureMutation.mutate(company.id)}>
                                  {company.is_featured ? <><StarOff className="mr-2 h-4 w-4" />Remove Featured</> : <><Star className="mr-2 h-4 w-4" />Mark Featured</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingCompany(company); setDeleteOpen(true); }}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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

      <ViewCompanyModal company={viewingCompany} open={viewOpen} onClose={() => setViewOpen(false)} />
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingCompany(null); }}
        onConfirm={confirmDelete}
        title="Delete Company"
        itemName={deletingCompany?.company_name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
