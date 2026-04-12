"use client";

import React, { useState } from "react";
import {
  useAdminPropertiesFull,
  useAdminDeleteProperty,
  useAdminApproveProperty,
  useAdminRejectProperty,
  useAdminFeatureProperty,
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
  CheckCircle, XCircle, Star, StarOff, MapPin, Loader2, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PropertyFormModal } from "@/components/real-estate/property-form-modal";
import { PropertyViewModal } from "@/components/real-estate/property-view-modal";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "rental", label: "Rental" },
  { value: "land_for_sale", label: "Land for Sale" },
  { value: "lease", label: "Lease" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial_space", label: "Commercial Space" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
  { value: "draft", label: "Draft" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
};

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

export default function AdminRealEstateListingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  const { data, isLoading } = useAdminPropertiesFull({ page, page_size: 20, search, category, status });
  const deleteMutation = useAdminDeleteProperty();
  const approveMutation = useAdminApproveProperty();
  const rejectMutation = useAdminRejectProperty();
  const featureMutation = useAdminFeatureProperty();

  const properties = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

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

  const anyLoading = approveMutation.isPending || rejectMutation.isPending || featureMutation.isPending;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Listings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage all real estate listings on the platform</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Listing
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] bg-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c.value || "all"} value={c.value || "all"}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value || "all"} value={s.value || "all"}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Real Estate Listings</CardTitle>
              <CardDescription className="text-xs">{totalItems} total listings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Property</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Specs</TableHead>
                  <TableHead className="font-semibold text-gray-700">Price</TableHead>
                  <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                  <TableHead className="font-semibold text-gray-700">Metrics</TableHead>
                  <TableHead className="font-semibold text-gray-700">Added</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-52" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No listings found
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((prop) => {
                    const images = parseImages(prop.images);
                    return (
                      <TableRow key={prop.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {images[0] ? (
                              <div className="h-10 w-14 shrink-0 bg-gray-100 border border-gray-200">
                                <img src={images[0]} alt={prop.title} className="h-full w-full object-cover rounded-none" />
                              </div>
                            ) : (
                              <div className="h-10 w-14 bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 rounded-none">
                                <Building2 className="h-5 w-5 text-gray-300" />
                              </div>
                            )}
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900 max-w-[200px] truncate">{prop.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />{prop.city || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600 capitalize">
                          {(prop.category || "").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600">
                          <div className="flex gap-1.5 items-center">
                            {prop.bedrooms ? `${prop.bedrooms} Bed` : ""}
                            {prop.bathrooms ? ` · ${prop.bathrooms} Bath` : ""}
                            {prop.size_m2 ? ` · ${prop.size_m2}m²` : (
                              (!prop.bedrooms && !prop.bathrooms) && "—"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] font-semibold text-gray-900">
                          {prop.currency} {prop.price.toLocaleString()}
                          {prop.price_period && (
                            <span className="text-[11px] text-gray-400 font-normal">/{(prop.price_period || "").replace("per_", "")}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600">
                          {prop.owner ? `${prop.owner.first_name} ${prop.owner.last_name}` : "—"}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span>{prop.views || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">
                          {format(new Date(prop.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border font-semibold capitalize", STATUS_STYLES[prop.status] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                            {(prop.status || "active").replace(/_/g, " ")}
                          </Badge>
                          {prop.is_featured && (
                            <Badge className="ml-1 text-xs border bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Star className="h-3 w-3 mr-1" />Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const isRowLoading =
                              (approveMutation.isPending && approveMutation.variables === prop.id) ||
                              (rejectMutation.isPending && rejectMutation.variables?.id === prop.id) ||
                              (featureMutation.isPending && featureMutation.variables === prop.id) ||
                              (deleteMutation.isPending && deletingProperty?.id === prop.id);

                            if (isRowLoading) {
                              return (
                                <div className="flex justify-end p-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                              );
                            }

                            return (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={anyLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(prop)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(prop)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Listing
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {prop.status !== "active" && (
                                <DropdownMenuItem onClick={() => approveMutation.mutate(prop.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                  <span className="text-emerald-700">Approve</span>
                                </DropdownMenuItem>
                              )}
                              {prop.status === "active" && (
                                <DropdownMenuItem onClick={() => rejectMutation.mutate({ id: prop.id })}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  <span className="text-red-700">Reject</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => featureMutation.mutate(prop.id)}>
                                {prop.is_featured ? (
                                  <><StarOff className="mr-2 h-4 w-4" /> Remove Featured</>
                                ) : (
                                  <><Star className="mr-2 h-4 w-4" /> Mark Featured</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(prop)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {totalItems} listings
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PropertyFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        property={editingProperty}
        isAdmin
      />
      <PropertyViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        property={viewingProperty}
        isAdmin
      />
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
