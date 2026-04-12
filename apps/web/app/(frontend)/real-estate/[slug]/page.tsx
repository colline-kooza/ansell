"use client";

import { useState, use } from "react";
import {
  Star, MapPin, Heart, Share, ChevronLeft, ChevronRight,
  Bed, Bath, Ruler, Users, Tag, CheckCircle2, Phone, Mail,
  Home, MessageSquare, Shield, Wifi, Car, Utensils,
  Tv, Wind, WashingMachine, Waves, TreePine, Flame,
  ArrowLeft, X,
} from "lucide-react";
import Link from "next/link";
import { usePublicProperty, Property } from "@/hooks/use-properties";

// ─── Utilities ─────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseAmenities(raw: string | undefined): Record<string, boolean> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, kitchen: Utensils, tv: Tv, airConditioning: Wind,
  washer: WashingMachine, pool: Waves, garden: TreePine, heating: Flame,
};

// ─── Photo Gallery ─────────────────────────────────────────────────────────────

function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);

  const mainImage = images[0] || `https://picsum.photos/seed/${title}/800/600`;
  const thumbs = images.slice(1, 5);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between px-1 pb-3">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs hover:bg-gray-100 underline">
              <Share className="size-4" /><span>Share</span>
            </button>
            <button onClick={() => setSaved((v) => !v)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs hover:bg-gray-100 underline">
              <Heart className="size-4" fill={saved ? "black" : "none"} /><span>Save</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="col-span-2 row-span-2 h-72 cursor-pointer overflow-hidden rounded-xl" onClick={() => { setCurrent(0); setOpen(true); }}>
            <img src={mainImage} alt={title} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
          {thumbs.map((url, idx) => (
            <div key={idx} className="relative h-[calc(9rem-4px)] cursor-pointer overflow-hidden rounded-xl" onClick={() => { setCurrent(idx + 1); setOpen(true); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${title} ${idx + 2}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold">Show all photos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile swipe */}
      <div className="relative md:hidden">
        <div className="relative h-56 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[current] || mainImage} alt={title} className="h-full w-full object-cover" />
          <div className="absolute bottom-3 right-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium">
            {current + 1}/{images.length || 1}
          </div>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow"><ChevronLeft className="size-5" /></button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow"><ChevronRight className="size-5" /></button>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex items-center justify-between p-4 text-white">
            <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-sm hover:bg-white/10">Close</button>
            <span className="text-sm">{current + 1} / {images.length}</span>
            <button onClick={() => setSaved((v) => !v)} className="p-2">
              <Heart className="size-5" fill={saved ? "white" : "none"} />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[current]} alt="" className="max-h-full max-w-full object-contain" />
            <button onClick={prev} className="absolute left-4 rounded-full bg-white p-2"><ChevronLeft className="size-5" /></button>
            <button onClick={next} className="absolute right-4 rounded-full bg-white p-2"><ChevronRight className="size-5" /></button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ property }: { property: Property }) {
  return (
    <div className="rounded-2xl border border-border shadow-xl">
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-bold text-foreground">
            {property.currency} {Number(property.price).toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/ {property.price_period}</span>
          </p>
          {property.is_featured && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Featured</span>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">Contact</p>
              <p className="mt-1 text-xs text-muted-foreground truncate">{property.contact_phone || "—"}</p>
            </div>
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">Email</p>
              <p className="mt-1 text-xs text-muted-foreground truncate">{property.contact_email || "—"}</p>
            </div>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">Location</p>
            <p className="mt-1 text-xs text-muted-foreground">{property.city}{property.address ? ` · ${property.address}` : ""}</p>
          </div>
        </div>

        <a href={`tel:${property.contact_phone}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:brightness-95">
          <Phone className="size-4" />Call Owner
        </a>
        <a href={`mailto:${property.contact_email}`}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
          <Mail className="size-4" />Send Email
        </a>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Shield className="mr-1 inline size-3" />Listed on Ansell — verified listing
        </p>
      </div>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

// ─── Property Detail Content ──────────────────────────────────────────────────

function PropertyDetailContent({ property }: { property: Property }) {
  const images = parseJsonArray(property.images);
  const amenitiesRaw = parseAmenities(property.amenities);
  const amenityEntries = Object.entries(amenitiesRaw).filter(([, v]) => v);

  // Placeholder reviews
  const reviews = [
    { id: 1, name: "Maria Awak", date: "March 2025", rating: 5, comment: "Excellent property, clean and exactly as described. The owner is very responsive." },
    { id: 2, name: "David Lual", date: "February 2025", rating: 4, comment: "Great location. Had minor issues with the water supply but was resolved quickly." },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link href="/real-estate" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />Back to listings
        </Link>

        {/* Gallery */}
        <PropertyGallery images={images.length ? images : [`https://picsum.photos/seed/${property.id}/800/600`, `https://picsum.photos/seed/${property.id}-2/800/600`, `https://picsum.photos/seed/${property.id}-3/800/600`]} title={property.title} />

        {/* Body */}
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-7">
            {/* Title & key facts */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[1.35rem] font-bold text-gray-900 md:block hidden">{property.title}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {property.bedrooms != null && <span className="flex items-center gap-1"><Bed className="size-3.5" />{property.bedrooms} beds</span>}
                    {property.bathrooms != null && <span className="flex items-center gap-1"><Bath className="size-3.5" />{property.bathrooms} baths</span>}
                    {property.size_m2 != null && <span className="flex items-center gap-1"><Ruler className="size-3.5" />{property.size_m2} m²</span>}
                  </p>
                </div>
                {property.is_featured && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Featured</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">New property</span>
                <span className="text-muted-foreground">· {property.views} views</span>
              </div>
            </div>

            {/* Owner info */}
            <div className="border-b border-border pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {(property.owner?.first_name?.[0] ?? "O").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {property.owner ? `${property.owner.first_name} ${property.owner.last_name}` : "Property Owner"}
                  </p>
                  <p className="text-xs text-muted-foreground">Owner · Verified on Ansell</p>
                </div>
              </div>
            </div>

            {/* Property info chips */}
            <div className="border-b border-border pb-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Home className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold capitalize">{property.category}</p>
                  <p className="text-xs text-muted-foreground">Property category</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MapPin className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{property.city}</p>
                  <p className="text-xs text-muted-foreground">{property.address || property.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Tag className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{property.currency} {Number(property.price).toLocaleString()} <span className="font-normal text-muted-foreground">/ {property.price_period}</span></p>
                  <p className="text-xs text-muted-foreground">Listing price</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-border pb-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">About this property</h2>
              <p className="text-sm leading-7 text-gray-700">{property.description || "No description provided."}</p>
            </div>

            {/* Amenities */}
            {amenityEntries.length > 0 && (
              <div className="border-b border-border pb-6">
                <h2 className="mb-4 text-base font-bold text-gray-900">What this place offers</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenityEntries.map(([key]) => {
                    const Icon = AMENITY_ICONS[key] ?? CheckCircle2;
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <Icon className="size-4 text-primary shrink-0" />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Reviews ({reviews.length})</h2>
                <button className="text-xs font-semibold text-primary hover:underline">Add a review</button>
              </div>
              <div className="space-y-5">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-border pb-5">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                    <p className="mt-2 text-sm text-gray-700">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: sticky booking card ── */}
          <div className="w-full shrink-0 lg:w-72 xl:w-80">
            <div className="lg:sticky lg:top-28">
              <BookingCard property={property} />
              <p className="mt-4 text-center">
                <button className="text-xs text-muted-foreground underline">Report this listing</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Property Not Found ───────────────────────────────────────────────────────

function PropertyNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <Home className="mb-4 size-12 text-muted-foreground/30" />
      <h1 className="text-xl font-bold text-foreground">Property Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This listing doesn&apos;t exist or has been removed.</p>
      <Link href="/real-estate" className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-95">
        Browse Listings
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PropertySkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-28 rounded bg-gray-200" />
      <div className="mb-6 h-72 w-full rounded-2xl bg-gray-200" />
      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-24 w-full rounded bg-gray-200" />
        </div>
        <div className="hidden w-72 lg:block">
          <div className="h-80 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Page Entry ───────────────────────────────────────────────────────────────

export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  
  const slugStr = decodeURIComponent(resolvedParams.slug || "");
  const idFromSlug = slugStr.includes("--") 
    ? slugStr.substring(slugStr.lastIndexOf("--") + 2) 
    : slugStr;

  const { data: property, isLoading, isError } = usePublicProperty(idFromSlug);

  if (isLoading) return <PropertySkeleton />;
  if (isError || !property) return <PropertyNotFound />;
  
  return <PropertyDetailContent property={property} />;
}
