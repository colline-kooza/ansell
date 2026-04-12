"use client";

import React from "react";
import Link from "next/link";
import { useMyCompany } from "@/hooks/use-companies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building, ShieldCheck, AlertCircle, ExternalLink,
  Globe, Phone, Mail, MapPin, Briefcase, Users, Eye,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function CompanySettingsPage() {
  const { data: company, isLoading } = useMyCompany();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!company) return null;

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Account and company settings</p>
      </div>

      {/* Account Status */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Company Status</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Current approval status of your company</p>
            </div>
            <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[company.status] ?? "")}>{company.status}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Identity Verification</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Company verification badge</p>
            </div>
            {company.is_verified ? (
              <Badge className="text-[11px] border bg-blue-50 text-blue-700 border-blue-200">
                <ShieldCheck className="h-3 w-3 mr-1" />Verified
              </Badge>
            ) : (
              <Badge className="text-[11px] border bg-gray-50 text-gray-500 border-gray-200">Not Verified</Badge>
            )}
          </div>
          {company.status === "rejected" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-red-700">Application Rejected</p>
                <p className="text-[12px] text-red-500 mt-0.5">Your company application was rejected. Contact support for more information.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Summary */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Company Summary</CardTitle>
            <CardDescription className="text-xs">Read-only overview — Edit from Profile</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
            <Link href="/company/dashboard/profile"><Settings className="h-3.5 w-3.5" />Edit Profile</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-50">
            {[
              { icon: Building, label: "Company Name", value: company.company_name },
              { icon: Briefcase, label: "Industry", value: company.industry?.replace(/_/g, " ") || "—" },
              { icon: Users, label: "Company Size", value: company.size ? `${company.size} employees` : "—" },
              { icon: MapPin, label: "Location", value: company.city || "—" },
              { icon: Phone, label: "Phone", value: company.phone || "—" },
              { icon: Mail, label: "Email", value: company.email || "—" },
              { icon: Globe, label: "Website", value: company.website || "—", link: company.website },
            ].map(({ icon: Icon, label, value, link }) => (
              <div key={label} className="flex items-center gap-3 py-2.5">
                <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <p className="text-[11px] text-gray-400 w-28 shrink-0">{label}</p>
                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline flex items-center gap-1">
                    {value} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-[13px] text-gray-700">{value as React.ReactNode}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Jobs Posted", value: company.jobs_count ?? 0, icon: Briefcase, color: "text-blue-500 bg-blue-50" },
              { label: "Tenders", value: company.tenders_count ?? 0, icon: Eye, color: "text-purple-500 bg-purple-50" },
              { label: "Profile Views", value: company.views ?? 0, icon: Eye, color: "text-emerald-500 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center p-3 rounded-lg border border-gray-100">
                <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold text-gray-900">{value as React.ReactNode}</p>
                <p className="text-[11px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registered */}
      <p className="text-[11px] text-gray-400 text-center">
        Company registered on {format(new Date(company.created_at), "dd MMMM yyyy")} · ID: {company.id}
      </p>
    </div>
  );
}
