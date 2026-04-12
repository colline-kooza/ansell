"use client";

import React, { useState } from "react";
import {
  useAdminUsers, useAdminUpdateUserRole, useAdminSuspendUser,
  useAdminActivateUser, useAdminDeleteUser, type User,
} from "@/hooks/use-admin-users";
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
  Search, MoreHorizontal, Eye, Trash2, Users, ShieldCheck,
  ShieldBan, Loader2, UserCog, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  company: "bg-indigo-50 text-indigo-700 border-indigo-200",
  user: "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLES = ["user", "owner", "company", "admin", "superadmin"];

function ViewUserModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const updateRoleMutation = useAdminUpdateUserRole();
  const suspendMutation = useAdminSuspendUser();
  const activateMutation = useAdminActivateUser();

  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">User Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-sm">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                <p className="text-[12px] text-gray-400">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge className={cn("text-[11px] border capitalize", ROLE_STYLES[user.role] ?? "")}>{user.role}</Badge>
                  <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[user.status] ?? "")}>{user.status}</Badge>
                  {user.is_verified && <Badge className="text-[11px] border bg-blue-50 text-blue-700 border-blue-200"><ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Phone", value: user.phone || "—" },
                { label: "Joined", value: format(new Date(user.created_at), "dd MMM yyyy") },
                { label: "Last Login", value: user.last_login ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true }) : "Never" },
                { label: "Active", value: user.is_active ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Change Role</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map(role => (
                  <Button key={role} size="sm" variant={user.role === role ? "default" : "outline"}
                    className="h-7 text-[12px] capitalize gap-1"
                    disabled={updateRoleMutation.isPending}
                    onClick={() => updateRoleMutation.mutate({ id: user.id, role })}>
                    {updateRoleMutation.isPending && updateRoleMutation.variables?.role === role ? <Loader2 className="h-3 w-3 animate-spin" /> : (user.role === role ? <Check className="h-3 w-3" /> : null)}
                    {role}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {user.is_active ? (
                <Button size="sm" variant="outline" className="text-[13px] text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                  disabled={suspendMutation.isPending}
                  onClick={() => suspendMutation.mutate(user.id, { onSuccess: onClose })}>
                  {suspendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldBan className="h-3.5 w-3.5" />}
                  Suspend User
                </Button>
              ) : (
                <Button size="sm" className="text-[13px] gap-1.5"
                  disabled={activateMutation.isPending}
                  onClick={() => activateMutation.mutate(user.id, { onSuccess: onClose })}>
                  {activateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Activate User
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-[13px]">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data, isLoading } = useAdminUsers({ page, page_size: 20, search, role });
  const deleteMutation = useAdminDeleteUser();
  const suspendMutation = useAdminSuspendUser();
  const activateMutation = useAdminActivateUser();

  const users = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingUser) return;
    deleteMutation.mutate(deletingUser.id, { onSuccess: () => { setDeleteOpen(false); setDeletingUser(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Users</h1>
        <p className="text-xs text-gray-500 mt-0.5">All platform users and role management</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={role || "all"} onValueChange={v => { setRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">User Registry</CardTitle>
          <CardDescription className="text-xs">{totalItems} total users</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">User</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Phone</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Role</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Joined</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500">{user.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", ROLE_STYLES[user.role] ?? "")}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(user.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[user.status] ?? STATUS_STYLES.active)}>{user.is_active ? "Active" : "Suspended"}</Badge>
                        {user.is_verified && <ShieldCheck className="inline h-3 w-3 text-blue-500 ml-1" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setViewingUser(user); setViewOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" />View / Edit Role
                            </DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem onClick={() => suspendMutation.mutate(user.id)}>
                                <ShieldBan className="mr-2 h-4 w-4 text-amber-500" />
                                <span className="text-amber-700">Suspend</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => activateMutation.mutate(user.id)}>
                                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700">Activate</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingUser(user); setDeleteOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} · {totalItems} users</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ViewUserModal user={viewingUser} open={viewOpen} onClose={() => setViewOpen(false)} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingUser(null); }} onConfirm={confirmDelete} title="Delete User" itemName={`${deletingUser?.first_name} ${deletingUser?.last_name}`} isLoading={deleteMutation.isPending} />
    </div>
  );
}
