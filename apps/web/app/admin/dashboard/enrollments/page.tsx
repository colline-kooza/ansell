"use client";

import React, { useState } from "react";
import { useAdminEnrollments, type Enrollment } from "@/hooks/use-admin-content";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  dropped: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminEnrollmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminEnrollments({ page, page_size: 20, search });
  const enrollments = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Enrollments</h1>
        <p className="text-xs text-gray-500 mt-0.5">All course enrollments across the platform</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search enrollments..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
      </div>
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Enrollments</CardTitle>
          <CardDescription className="text-xs">{totalItems} total</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Student</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Course</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Progress</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Enrolled</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(5)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map(enrollment => (
                    <TableRow key={enrollment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">
                            {enrollment.user ? `${enrollment.user.first_name} ${enrollment.user.last_name}` : "—"}
                          </p>
                          <p className="text-[11px] text-gray-400">{enrollment.user?.email || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600 max-w-[200px] truncate">{enrollment.course?.title || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-gray-100 rounded-full max-w-[80px]">
                            <div
                              className="h-1.5 bg-primary rounded-full"
                              style={{ width: `${enrollment.progress_percent ?? 0}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500">{enrollment.progress_percent ?? 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(enrollment.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[enrollment.status] ?? "bg-gray-50 text-gray-600 border-gray-200")}>{enrollment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
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
    </div>
  );
}
