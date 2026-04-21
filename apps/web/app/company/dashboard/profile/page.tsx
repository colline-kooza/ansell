"use client";

import React, { useState, useEffect } from "react";
import { useMyCompany, useUpdateCompanyProfile } from "@/hooks/use-companies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building, Globe, Phone, Mail, MapPin, Loader2,
  ShieldCheck, Camera, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { toast } from "sonner";

const INDUSTRIES = [
  "technology", "manufacturing", "construction", "finance", "retail",
  "healthcare", "education", "real_estate", "logistics", "hospitality",
  "media", "energy", "agriculture", "government", "other",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function CompanyProfilePage() {
  const { data: company, isLoading } = useMyCompany();
  const updateMutation = useUpdateCompanyProfile();

  const [form, setForm] = useState({
    company_name: "", description: "", industry: "", size: "", founded_year: "",
    website: "", email: "", phone: "", city: "", address: "",
  });
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "media">("info");

  useEffect(() => {
    if (company) {
      setForm({
        company_name: company.company_name || "",
        description: company.description || "",
        industry: company.industry || "",
        size: company.size || company.employee_count || "",
        founded_year: company.founded_year ? String(company.founded_year) : "",
        website: company.website || "",
        email: company.email || "",
        phone: company.phone || company.phone_number || "",
        city: company.city || "",
        address: company.address || "",
      });
      setLogoImages(company.logo_url ? [company.logo_url] : []);
      setCoverImages(company.cover_image_url ? [company.cover_image_url] : []);
    }
  }, [company]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.company_name.trim()) { toast.error("Company name is required"); return; }
    await updateMutation.mutateAsync({
      company_name: form.company_name,
      description: form.description,
      industry: form.industry,
      employee_count: form.size || undefined,
      founded_year: form.founded_year ? Number(form.founded_year) : undefined,
      website: form.website || undefined,
      email: form.email || undefined,
      phone_number: form.phone || undefined,
      city: form.city || undefined,
      address: form.address || undefined,
      logo_url: logoImages[0] || company?.logo_url || undefined,
      cover_image_url: coverImages[0] || company?.cover_image_url || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Company Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your public company information</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5 text-[13px]">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Status banner */}
      {!company.is_active && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-[13px]">
          <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-amber-800">
            <span className="font-semibold">Status: </span>
            Reviewing — Your profile is under admin review.
          </p>
          <Badge className={cn("ml-auto text-[11px] border capitalize", STATUS_STYLES.pending)}>Pending</Badge>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[{ k: "info" as const, label: "Company Info" }, { k: "media" as const, label: "Logo & Images" }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={cn("px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.k ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">General Information</CardTitle>
              <CardDescription className="text-xs">Your public company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Company Name *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Company name" className="h-9 text-[13px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Industry</Label>
                  <Select value={form.industry} onValueChange={v => set("industry", v)}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Company Size</Label>
                  <Select value={form.size} onValueChange={v => set("size", v)}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Employees" /></SelectTrigger>
                    <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Description / About</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="What does your company do?" className="text-[13px] resize-none" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Year Founded</Label>
                <Input type="number" value={form.founded_year} onChange={e => set("founded_year", e.target.value)} placeholder="e.g. 2010" className="h-9 text-[13px] max-w-[150px]" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+211 922 000 000" className="h-9 text-[13px] pl-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="company@email.com" className="h-9 text-[13px] pl-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input type="url" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://company.com" className="h-9 text-[13px] pl-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">City / Town</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className="h-9 text-[13px] pl-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500 mb-1.5 block">Address</Label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" className="h-9 text-[13px]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "media" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />Company Logo
              </CardTitle>
              <CardDescription className="text-xs">Displayed on your profile and job listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {logoImages[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoImages[0]} alt="Logo" className="h-16 w-16 object-contain border border-gray-200" />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                    <Building className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-semibold text-gray-700">Company Logo</p>
                  <p className="text-[11px] text-gray-400">PNG or JPG, max 5MB. Square works best.</p>
                </div>
              </div>
              <MultiImageUpload value={logoImages} onChange={setLogoImages} maxFiles={1} maxSize={5} />
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-400" />Cover Image
              </CardTitle>
              <CardDescription className="text-xs">Header image shown on your company profile page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {coverImages[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImages[0]} alt="Cover" className="w-full h-32 object-cover border border-gray-200" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <MultiImageUpload value={coverImages} onChange={setCoverImages} maxFiles={1} maxSize={10} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save button bottom */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5 text-[13px]">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
