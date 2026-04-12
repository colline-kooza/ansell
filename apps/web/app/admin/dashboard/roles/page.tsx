"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminUsers, useAdminUpdateUserRole, type User } from "@/hooks/use-admin-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShieldCheck, ShieldAlert, Users, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  company: "bg-indigo-50 text-indigo-700 border-indigo-200",
  user: "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLES = ["user", "owner", "company", "admin", "superadmin"];

export default function AdminRolesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers({ page: 1, page_size: 50, search });
  const updateRoleMutation = useAdminUpdateUserRole();

  const users = data?.data ?? [];

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Roles & Access</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage administrative and staff access levels</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : users.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
            <p>No users found</p>
          </div>
        ) : (
          users.map(user => (
            <Card key={user.id} className="bg-white border-gray-200 shadow-sm relative overflow-hidden group">
              <div className={cn("absolute top-0 left-0 w-1 h-full", user.role.includes("admin") ? "bg-purple-500" : "bg-gray-200")} />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-sm bg-gray-100">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate" title={`${user.first_name} ${user.last_name}`}>{user.first_name} {user.last_name}</p>
                      <p className="text-[11px] text-gray-500 truncate" title={user.email}>{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                  <Badge className={cn("text-[11px] border capitalize", ROLE_STYLES[user.role] ?? "")}>{user.role}</Badge>
                  <Select
                    value={user.role}
                    onValueChange={(val) => updateRoleMutation.mutate({ id: user.id, role: val })}
                  >
                    <SelectTrigger disabled={updateRoleMutation.isPending} className="h-7 w-28 text-[11px] bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r} className="text-[11px] capitalize">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
