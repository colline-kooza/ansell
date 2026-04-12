"use client";

import React, { useState } from "react";
import {
  useOwnerPropertiesFull,
  useOwnerDeleteProperty,
  type Property,
} from "@/hooks/use-properties";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MoreHorizontal, Eye, Edit, Trash2, PlusCircle, Building2,
  MapPin, Clock, CheckCircle, XCircle, FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyFormModal } from "@/components/real-estate/property-form-modal";
import { PropertyViewModal } from "@/components/real-estate/property-view-modal";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";

function parseImages(s: unknown): string[] {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(i => typeof i === 'string');
  try {
    const parsed = JSON.parse(s as string);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return [parsed];
  } catch {
    if (typeof s === 'string' && s.startsWith('http')) return [s];
  }
  return [];
}

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  pending_review: { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  draft: { label: "Draft", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: FileEdit },
  archived: { label: "Archived", cls: "bg-gray-50 text-gray-600 border-gray-200", icon: Building2 },
};

export default function OwnerListingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  const { data, isLoading } = useOwnerPropertiesFull({ page, page_size: 20, status: statusFilter });
  const deleteMutation = useOwnerDeleteProperty();

  const properties = (data?.data ?? []).filter((p) => {
    if (!search) return true;
    return p.title.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = data?.total_pages ?? 1;
  const totalActive = data?.data?.filter(p => p.status === "active").length ?? 0;
  const totalPending = data?.data?.filter(p => p.status === "pending_review").length ?? 0;

  const handleCreate = () => { setEditingProperty(null); setFormOpen(true); };
  const handleEdit = (p: Property) => { setEditingProperty(p); setFormOpen(true); };
  const handleView = (p: Property) => { setViewingProperty(p); setViewOpen(true); };
  const handleDelete = (p: Property) => { setDeletingProperty(p); setDeleteOpen(true); };

  const confirmDelete = () => {
    if (!deletingProperty) return;
    deleteMutation.mutate(deletingProperty.id, {
      onSuccess: () => { setDeleteOpen(false); setDeletingProperty(null); },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your property listings</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-12 gap-3 mt-2">
        <div className="col-span-12 sm:col-span-4">
           <Card className="bg-gradient-to-br from-blue-50 to-white shadow-sm border border-blue-100 transition-all h-full">
             <CardContent className="p-4 flex items-center gap-3">
               <div className="h-9 w-9 rounded-lg bg-blue-100/50 flex items-center justify-center shrink-0">
                 <Building2 className="h-4.5 w-4.5 text-blue-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-gray-900 leading-none">{data?.total_items ?? 0}</p>
                 <p className="text-[11px] font-bold text-blue-700 mt-1 uppercase tracking-wider">Total Listings</p>
               </div>
             </CardContent>
           </Card>
        </div>
        <div className="col-span-12 sm:col-span-4">
           <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border border-emerald-100 transition-all h-full">
             <CardContent className="p-4 flex items-center gap-3">
               <div className="h-9 w-9 rounded-lg bg-emerald-100/50 flex items-center justify-center shrink-0">
                 <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-gray-900 leading-none">{totalActive}</p>
                 <p className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-wider">Active</p>
               </div>
             </CardContent>
           </Card>
        </div>
        <div className="col-span-12 sm:col-span-4">
           <Card className="bg-gradient-to-br from-amber-50 to-white shadow-sm border border-amber-100 transition-all h-full">
             <CardContent className="p-4 flex items-center gap-3">
               <div className="h-9 w-9 rounded-lg bg-amber-100/50 flex items-center justify-center shrink-0">
                 <Clock className="h-4.5 w-4.5 text-amber-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-gray-900 leading-none">{totalPending}</p>
                 <p className="text-[11px] font-bold text-amber-700 mt-1 uppercase tracking-wider">Pending Review</p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-4">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Property</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Price</TableHead>
                  <TableHead className="font-semibold text-gray-700">Views</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-14">
                      <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400 mb-4">No listings yet</p>
                      <Button size="sm" onClick={handleCreate} className="gap-2">
                        <PlusCircle className="h-4 w-4" /> Create your first listing
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((prop) => {
                    const images = parseImages(prop.images);
                    const st = STATUS_STYLES[prop.status] ?? { label: prop.status, cls: "bg-gray-50 text-gray-600 border-gray-200", icon: Building2 };
                    const StatusIcon = st.icon;
                    return (
                      <TableRow key={prop.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 bg-gray-100 border border-gray-200 shrink-0">
                              {images[0] ? (
                                <img src={images[0]} alt={prop.title} className="h-full w-full object-cover rounded-none" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900 max-w-[180px] truncate">{prop.title}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />{prop.city || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600 capitalize">{prop.category.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-[13px] font-semibold text-gray-900">
                          {prop.currency} {prop.price.toLocaleString()}
                          {prop.price_period && <span className="text-[11px] text-gray-400 font-normal">/{prop.price_period.replace("per_", "")}</span>}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500">{prop.views}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border font-medium capitalize", st.cls)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(prop)}>
                                <Eye className="mr-2 h-4 w-4" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(prop)}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(prop)}>
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PropertyFormModal open={formOpen} onOpenChange={setFormOpen} property={editingProperty} isAdmin={false} />
      <PropertyViewModal open={viewOpen} onOpenChange={setViewOpen} property={viewingProperty} isAdmin={false} />
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeletingProperty(null); }}
        onConfirm={confirmDelete}
        title="Delete Listing"
        itemName={deletingProperty?.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
