"use client";

import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Eye, Tag, ChevronRight, Clock3 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import type { Property } from "@/hooks/use-properties";
import { useUserStore } from "@/stores/user-store";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PropertyListProps {
  properties: Property[];
}

export function PropertyList({ properties }: PropertyListProps) {
  return (
    <div className="space-y-3">
      {properties.map((property, index) => (
        <PropertyListCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}

export function PropertyListCard({
  property,
  index,
  compact = false,
}: {
  property: Property;
  index: number;
  compact?: boolean;
}) {
  const { isFavoriteProperty, toggleFavoriteProperty } = useUserStore();
  const wishlisted = isFavoriteProperty(property.id);
  const [imgError, setImgError] = useState(false);

  let imagesArr: string[] = [];
  try {
    imagesArr =
      typeof property.images === "string"
        ? JSON.parse(property.images || "[]")
        : Array.isArray(property.images)
          ? property.images
          : [];
  } catch {}

  const coverImage = imgError
    ? `https://picsum.photos/seed/prop-${property.id ?? index}/400/300`
    : imagesArr[0] ?? `https://picsum.photos/seed/prop-${property.id ?? index}/400/300`;

  const price = property.price
    ? `${property.currency || "SSP"} ${Number(property.price).toLocaleString()}${
        property.price_period ? `/${property.price_period.replace("per_", "")}` : ""
      }`
    : "Price on request";

  const location = [property.city, property.address].filter(Boolean).join(", ") || "South Sudan";
  const postedAgo = property.created_at
    ? formatDistanceToNow(new Date(property.created_at), { addSuffix: true })
    : null;

  const propertySlug = `${(property.title || "property").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}--${property.id}`;
  const propertyHref = `/real-estate/${propertySlug}`;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.04 }}
        className="group overflow-hidden rounded-[1.1rem] border border-[#e6ecd9] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all hover:border-primary/30 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:rounded-2xl sm:border-gray-100 sm:p-0 sm:shadow-none sm:hover:border-primary/40 sm:hover:shadow-lg sm:hover:shadow-gray-100"
      >
        <div className="flex items-start gap-3 sm:hidden">
          <Link href={propertyHref} className="relative flex size-[78px] shrink-0 overflow-hidden rounded-[1rem] border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={property.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {property.is_featured && (
              <div className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-gray-900 shadow-sm">
                Featured
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Link href={propertyHref} className="block">
                  <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-gray-900 transition-colors hover:text-primary">
                    {property.title}
                  </h3>
                </Link>
                <p className="mt-1 truncate text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">{property.city || "South Sudan"}</span>
                  {property.address ? ` - ${property.address}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleFavoriteProperty(property.id)}
                className="shrink-0 p-1 transition-transform hover:scale-110 active:scale-90"
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`size-5 stroke-[2px] transition-colors ${
                    wishlisted ? "fill-red-500 text-red-500" : "fill-transparent text-gray-400"
                  }`}
                />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {property.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                  <Tag className="size-3" />
                  {String(property.category).replace(/_/g, " ")}
                </span>
              )}
              {property.bedrooms != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  <Bed className="size-3" />
                  {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
                </span>
              )}
              {property.bathrooms != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  <Bath className="size-3" />
                  {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-gray-900">{price}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                  {postedAgo && (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" />
                      {postedAgo}
                    </span>
                  )}
                  {(property.views ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" />
                      {(property.views ?? 0).toLocaleString()} views
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={propertyHref}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98]"
              >
                View
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex sm:flex-row sm:items-stretch">
          <Link href={propertyHref} className="relative hidden shrink-0 overflow-hidden sm:block sm:w-40 lg:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={property.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {property.is_featured && (
              <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-white px-2 py-0.5 shadow-sm">
                <span className="text-[10px] font-semibold text-gray-900">Featured</span>
              </div>
            )}
            {property.category && !property.is_featured && (
              <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                <span className="text-[10px] font-semibold capitalize text-white">{String(property.category)}</span>
              </div>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between gap-2 p-4">
            <div>
              <Link href={propertyHref} className="block">
                <h3 className="line-clamp-1 text-[14px] font-bold text-gray-900 transition-colors hover:text-primary">
                  {property.title}
                </h3>
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="size-3 shrink-0" />
                {location}
              </p>

              {property.description && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{property.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {property.category && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                  <Tag className="size-3" />
                  {String(property.category).replace(/_/g, " ")}
                </span>
              )}
              {property.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <Bed className="size-3" />
                  {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <Bath className="size-3" />
                  {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
                </span>
              )}
              {(property.views ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Eye className="size-3" />
                  {(property.views ?? 0).toLocaleString()} views
                </span>
              )}
              {postedAgo && <span className="text-gray-400">{postedAgo}</span>}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-gray-100 px-4 py-4 lg:min-w-[118px]">
            <div className="text-right">
              <p className="text-[12px] font-bold text-gray-900">{price}</p>
              {property.status === "active" && (
                <p className="text-[10px] font-medium text-emerald-600">Available</p>
              )}
            </div>
            <Link
              href={propertyHref}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98]"
            >
              View
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100"
    >
      <Link href={propertyHref} className="absolute inset-0 z-10" aria-label={property.title} />

      <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
        <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={property.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {property.is_featured && (
            <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-white px-2 py-0.5 shadow-sm">
              <span className="text-[10px] font-semibold text-gray-900">Featured</span>
            </div>
          )}
          {property.category && !property.is_featured && (
            <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 backdrop-blur-sm">
              <span className="text-[10px] font-semibold capitalize text-white">{String(property.category)}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => toggleFavoriteProperty(property.id)}
            className="absolute right-2 top-2 z-20 p-1 transition-transform hover:scale-110 active:scale-90"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`size-5 stroke-[2px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-colors ${
                wishlisted ? "fill-red-500 text-red-500" : "fill-black/20 text-white"
              }`}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2 p-4">
          <div>
            <h3 className="line-clamp-1 text-[15px] font-bold text-gray-900 transition-colors group-hover:text-primary">
              {property.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="size-3 shrink-0" />
              {location}
            </p>

            {property.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{property.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {property.category && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                <Tag className="size-3" />
                {String(property.category).replace(/_/g, " ")}
              </span>
            )}
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="size-3" />
                {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="size-3" />
                {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
              </span>
            )}
            {(property.views ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <Eye className="size-3" />
                {(property.views ?? 0).toLocaleString()} views
              </span>
            )}
            {postedAgo && <span className="text-gray-400">{postedAgo}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:px-5 sm:py-4">
          <div className="text-right">
            <p className="text-[13px] font-bold text-gray-900">{price}</p>
            {property.status === "active" && (
              <p className="text-[10px] font-medium text-emerald-600">Available</p>
            )}
          </div>
          <span className="relative z-20 flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <ChevronRight className="size-3.5" />
            View
          </span>
        </div>
      </div>
    </motion.div>
  );
}
