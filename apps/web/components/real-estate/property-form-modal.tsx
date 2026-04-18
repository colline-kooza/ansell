"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useAdminCreateProperty, useAdminUpdateProperty,
  useOwnerCreateProperty, useOwnerUpdateProperty,
  type Property,
} from "@/hooks/use-properties";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { Loader2, Check, ChevronLeft, ChevronRight, Home, Camera, DollarSign, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "rental", label: "Rental" },
  { value: "land_for_sale", label: "Land for Sale" },
  { value: "lease", label: "Lease" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial_space", label: "Commercial Space" },
];

const PRICE_PERIODS = [
  { value: "per_month", label: "Per Month" },
  { value: "per_year", label: "Per Year" },
  { value: "total", label: "Total (once)" },
];

const CURRENCIES = ["USD", "UGX", "KES", "TZS", "SSP"];

const COMMON_AMENITIES = ["Parking", "Security", "Swimming Pool", "Gym", "Garden", "Generator", "CCTV", "Water", "Internet", "Furnished"];

const STEPS = [
  { id: 1, name: "Details", icon: Home },
  { id: 2, name: "Photos", icon: Camera },
  { id: 3, name: "Location", icon: MapPin },
  { id: 4, name: "Pricing", icon: DollarSign },
  { id: 5, name: "Review", icon: Settings },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  size_m2: z.number().nullable().optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  city: z.string().min(1, "City is required"),
  location: z.string().optional(),
  address: z.string().optional(),
  price: z.number().min(1, "Price is required"),
  price_period: z.string().optional(),
  currency: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PropertyFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property?: Property | null;
  isAdmin?: boolean;
}

export function PropertyFormModal({ open, onOpenChange, property, isAdmin }: PropertyFormModalProps) {
  const [step, setStep] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const adminCreate = useAdminCreateProperty();
  const adminUpdate = useAdminUpdateProperty();
  const ownerCreate = useOwnerCreateProperty();
  const ownerUpdate = useOwnerUpdateProperty();

  const createMutation = isAdmin ? adminCreate : ownerCreate;
  const updateMutation = isAdmin ? adminUpdate : ownerUpdate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "USD",
      price_period: "per_month",
      is_active: true,
      is_featured: false,
      images: [],
      amenities: [],
    },
  });

  const values = watch();

  useEffect(() => {
    if (open) {
      setStep(1);
      if (property) {
        const parseArr = (d: unknown) => Array.isArray(d) ? d : (typeof d === "string" ? JSON.parse(d || "[]") : []);
        const imgs = parseArr(property.images || (property as any).images_url || (property as any).gallery || []);
        const ams = parseArr(property.amenities);
        setSelectedAmenities(ams);
        reset({
          title: property.title,
          description: property.description,
          category: property.category,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          size_m2: property.size_m2 ?? null,
          images: imgs,
          amenities: ams,
          city: property.city,
          location: property.location,
          address: property.address,
          price: property.price,
          price_period: property.price_period || "per_month",
          currency: property.currency || "USD",
          contact_phone: property.contact_phone,
          contact_email: property.contact_email,
          is_featured: property.is_featured,
          is_active: property.is_active,
          status: property.status,
        });
      } else {
        setSelectedAmenities([]);
        reset({
          currency: "USD",
          price_period: "per_month",
          is_active: true,
          is_featured: false,
          images: [],
          amenities: [],
          status: isAdmin ? "active" : "pending_review",
        });
      }
    }
  }, [open, property, isAdmin, reset]);

  const toggleAmenity = (a: string) => {
    const updated = selectedAmenities.includes(a)
      ? selectedAmenities.filter((x) => x !== a)
      : [...selectedAmenities, a];
    setSelectedAmenities(updated);
    setValue("amenities", updated);
  };

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 1) fields = ["title", "category"];
    if (step === 3) fields = ["city"];
    if (step === 4) fields = ["price"];
    const valid = await trigger(fields);
    if (!valid) {
      toast.error("Please fill all required fields");
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      amenities: JSON.stringify(selectedAmenities),
      images: JSON.stringify(data.images ?? []),
    };
    try {
      if (property) {
        await (updateMutation.mutateAsync as any)({ id: property.id, payload });
      } else {
        await (createMutation.mutateAsync as any)(payload);
      }
      onOpenChange(false);
    } catch {
      // error toast handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{property ? "Edit Listing" : "Create New Listing"}</DialogTitle>
          <DialogDescription className="sr-only">Property form</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b shrink-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent && "bg-gray-900 text-white ring-2 ring-gray-900/20",
                    !isDone && !isCurrent && "bg-gray-100 text-gray-400"
                  )}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
                  </div>
                  <p className={cn("text-[9px] mt-1 font-semibold uppercase tracking-tight", isCurrent ? "text-gray-900" : "text-gray-400")}>
                    {s.name}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-1 mb-4 transition-all", step > s.id ? "bg-primary" : "bg-gray-200")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Step 1: Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Title <span className="text-red-500">*</span></Label>
                  <Input {...register("title")} placeholder="e.g. 3 Bedroom House in Kampala" className="h-11" />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Category <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setValue("category", c.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all",
                          values.category === c.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Description</Label>
                  <Textarea {...register("description")} rows={4} placeholder="Describe the property in detail..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Bedrooms</Label>
                    <Input type="number" min={0} {...register("bedrooms", { valueAsNumber: true })} placeholder="3" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Bathrooms</Label>
                    <Input type="number" min={0} {...register("bathrooms", { valueAsNumber: true })} placeholder="2" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Size (m²)</Label>
                    <Input type="number" min={0} {...register("size_m2", { valueAsNumber: true })} placeholder="120" className="h-10" />
                  </div>
                </div>
                {/* Amenities */}
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AMENITIES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                          selectedAmenities.includes(a)
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Photos */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="rounded-2xl border border-dashed border-gray-200 p-5">
                  <MultiImageUpload
                    value={values.images}
                    onChange={(urls) => setValue("images", urls)}
                    maxFiles={8}
                    maxSize={10}
                    onlyImages
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Contact Phone</Label>
                    <Input {...register("contact_phone")} placeholder="+211 922 000 000" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Contact Email</Label>
                    <Input type="email" {...register("contact_email")} placeholder="contact@example.com" className="h-10" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">City <span className="text-red-500">*</span></Label>
                  <Input {...register("city")} placeholder="e.g. Kampala" className="h-11" />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Neighbourhood / Area</Label>
                  <Input {...register("location")} placeholder="e.g. Kololo, Nakasero" className="h-10" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Full Address</Label>
                  <Input {...register("address")} placeholder="Plot 25, Bombo Road" className="h-10" />
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Price <span className="text-red-500">*</span></Label>
                  <Input type="number" min={0} {...register("price", { valueAsNumber: true })} placeholder="1,500,000" className="h-12 text-lg font-bold" />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Currency</Label>
                    <Select value={values.currency || "USD"} onValueChange={(v) => setValue("currency", v)}>
                      <SelectTrigger className="h-10 w-full bg-white">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Price Period</Label>
                    <Select value={values.price_period || "per_month"} onValueChange={(v) => setValue("price_period", v)}>
                      <SelectTrigger className="h-10 w-full bg-white">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Status</Label>
                    <Select value={values.status || "active"} onValueChange={(v) => setValue("status", v)}>
                      <SelectTrigger className="h-10 w-full bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {[
                    { label: "Title", value: values.title },
                    { label: "Category", value: CATEGORIES.find(c => c.value === values.category)?.label || values.category },
                    { label: "City", value: values.city },
                    { label: "Price", value: `${values.currency || "USD"} ${Number(values.price).toLocaleString()} / ${values.price_period?.replace("per_", "") || "month"}` },
                    { label: "Photos", value: `${(values.images ?? []).length} uploaded` },
                    { label: "Amenities", value: selectedAmenities.length > 0 ? selectedAmenities.join(", ") : "None selected" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center px-5 py-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                      <span className="text-sm text-gray-800 font-medium text-right max-w-[60%] truncate">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                      <Label className="text-sm font-medium">Active (visible publicly)</Label>
                      <Switch checked={values.is_active ?? true} onCheckedChange={(v) => setValue("is_active", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-yellow-100 bg-yellow-50/30">
                      <Label className="text-sm font-medium text-yellow-800">Featured on homepage</Label>
                      <Switch checked={values.is_featured ?? false} onCheckedChange={(v) => setValue("is_featured", v)} />
                    </div>
                  </div>
                )}
                {!isAdmin && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                    ⚡ Your listing will be submitted for admin review before going live.
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="px-6 py-4 border-t flex justify-between bg-white shrink-0">
          <Button type="button" variant="outline" onClick={() => { if (step === 1) onOpenChange(false); else setStep(s => s - 1); }} disabled={isSubmitting}>
            {step === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
          </Button>
          {step < 5 ? (
            <Button type="button" onClick={nextStep} disabled={isSubmitting}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />{property ? "Update Listing" : "Submit Listing"}</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
