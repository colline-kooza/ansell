"use client";

import React, { useState } from "react";
import { useOwnerInquiries, useMarkInquiryRead, type PropertyInquiry } from "@/hooks/use-properties";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Mail, Phone, Eye, Building2, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OwnerInquiriesPage() {
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<PropertyInquiry | null>(null);

  const { data, isLoading } = useOwnerInquiries({ page, page_size: 20 });
  const markReadMutation = useMarkInquiryRead();

  const inquiries = data?.data ?? [];
  const unread = inquiries.filter(i => !i.is_read).length;

  const handleView = (inquiry: PropertyInquiry) => {
    setViewing(inquiry);
    if (!inquiry.is_read) {
      markReadMutation.mutate(inquiry.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">Messages from potential buyers and renters</p>
        </div>
        {unread > 0 && (
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-sm px-3 py-1">
            {unread} unread
          </Badge>
        )}
      </div>

      <Card className="bg-white border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Inquiries</CardTitle>
          <CardDescription className="text-xs">{data?.total_items ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">From</TableHead>
                  <TableHead className="font-semibold text-gray-700">Property</TableHead>
                  <TableHead className="font-semibold text-gray-700">Message</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : inquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-14">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">No inquiries yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiries.map((inq) => (
                    <TableRow
                      key={inq.id}
                      className={cn("hover:bg-gray-50 transition-colors cursor-pointer", !inq.is_read && "bg-primary/5")}
                      onClick={() => handleView(inq)}
                    >
                      <TableCell>
                        <div>
                          <p className={cn("text-sm font-semibold", !inq.is_read ? "text-gray-900" : "text-gray-700")}>{inq.name}</p>
                          <p className="text-xs text-gray-400">{inq.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[150px] truncate">
                        {inq.property?.title || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {inq.message}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(inq.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs border", inq.is_read
                          ? "bg-gray-50 text-gray-500 border-gray-200"
                          : "bg-primary/10 text-primary border-primary/20 font-semibold"
                        )}>
                          {inq.is_read ? "Read" : "New"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View modal */}
      <Dialog open={!!viewing} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        {viewing && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Inquiry from {viewing.name}
              </DialogTitle>
              <DialogDescription>
                Received on {new Date(viewing.created_at).toLocaleDateString("en-GB", { dateStyle: "long" })}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="space-y-4 py-1">
              {viewing.property && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Property</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    {viewing.property.title}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Email</p>
                  <a href={`mailto:${viewing.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" />{viewing.email}
                  </a>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Phone</p>
                  {viewing.phone ? (
                    <a href={`tel:${viewing.phone}`} className="text-sm text-gray-700 flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" />{viewing.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold uppercase text-blue-400 mb-2">Message</p>
                <p className="text-sm text-gray-700 leading-6">{viewing.message}</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <a
                href={`mailto:${viewing.email}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Mail className="h-4 w-4" />Reply by Email
              </a>
              {viewing.phone && (
                <a
                  href={`tel:${viewing.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:brightness-95 transition"
                >
                  <Phone className="h-4 w-4" />Call
                </a>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
