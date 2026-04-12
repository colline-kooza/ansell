"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Property } from "@/hooks/use-properties";
import {
  Building2, MapPin, Phone, Mail, Bed, Bath, Maximize2, Eye,
  Star, Calendar, User, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PropertyViewModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property | null;
  isAdmin?: boolean;
}

function parseImages(s: string | string[]): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || "[]"); } catch { return []; }
}

function parseAmenities(s: string | string[]): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || "[]"); } catch { return []; }
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

export function PropertyViewModal({ open, onOpenChange, property, isAdmin }: PropertyViewModalProps) {
  const [imgIndex, setImgIndex] = useState(0);

  if (!property) return null;

  const images = parseImages(property.images);
  const amenities = parseAmenities(property.amenities);

  const prevImg = () => setImgIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const nextImg = () => setImgIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-gray-900 leading-tight truncate pr-4">
                {property.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge className={cn("text-xs border", STATUS_STYLES[property.status] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                  {property.status.replace(/_/g, " ")}
                </Badge>
                {property.is_featured && (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs border">
                    <Star className="h-3 w-3 mr-1" />Featured
                  </Badge>
                )}
                <span className="text-sm text-gray-500 capitalize">{property.category.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Image carousel */}
            {images.length > 0 ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={images[imgIndex]}
                  alt={`${property.title} ${imgIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={cn("h-1.5 rounded-full transition-all", i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60")}
                        />
                      ))}
                    </div>
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {imgIndex + 1}/{images.length}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-gray-200" />
              </div>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={cn("shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all", i === imgIndex ? "border-primary" : "border-transparent")}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Price & Location */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-gray-500 mb-0.5">Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {property.currency} {property.price.toLocaleString()}
                </p>
                {property.price_period && (
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{property.price_period.replace(/_/g, " ")}</p>
                )}
              </div>
              <div className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" />Location</p>
                <p className="text-sm font-semibold text-gray-900">{property.city}</p>
                {property.address && <p className="text-xs text-gray-500 mt-0.5">{property.address}</p>}
                {property.location && <p className="text-xs text-gray-400">{property.location}</p>}
              </div>
            </div>

            {/* Property Details */}
            {(property.bedrooms || property.bathrooms || property.size_m2) && (
              <div className="grid grid-cols-3 gap-3">
                {property.bedrooms != null && (
                  <div className="p-3 rounded-xl border border-gray-100 text-center">
                    <Bed className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property.bedrooms}</p>
                    <p className="text-xs text-gray-400">Bedrooms</p>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="p-3 rounded-xl border border-gray-100 text-center">
                    <Bath className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property.bathrooms}</p>
                    <p className="text-xs text-gray-400">Bathrooms</p>
                  </div>
                )}
                {property.size_m2 != null && (
                  <div className="p-3 rounded-xl border border-gray-100 text-center">
                    <Maximize2 className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property.size_m2}</p>
                    <p className="text-xs text-gray-400">m²</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-6">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span key={a} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {(property.contact_phone || property.contact_email) && (
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Contact</h3>
                <div className="space-y-2">
                  {property.contact_phone && (
                    <a href={`tel:${property.contact_phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary">
                      <Phone className="h-4 w-4" />{property.contact_phone}
                    </a>
                  )}
                  {property.contact_email && (
                    <a href={`mailto:${property.contact_email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary">
                      <Mail className="h-4 w-4" />{property.contact_email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Meta */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>{property.owner ? `${property.owner.first_name} ${property.owner.last_name}` : "Admin"}</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{property.views} views</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(property.created_at).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            )}

            {/* Review note */}
            {property.review_note && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs font-bold uppercase text-red-400 tracking-wide mb-1">Review Note</p>
                <p className="text-sm text-red-700">{property.review_note}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
