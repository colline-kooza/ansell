"use client";

import Link from "next/link";
import { Heart, MapPin, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/hooks/use-properties";
import { useUserStore } from "@/stores/user-store";

interface PropertyGridProps {
  properties: Property[];
}

export function PropertyGrid({ properties }: PropertyGridProps) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {properties.map((property, index) => (
        <PropertyCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}

function PropertyCard({ property, index }: { property: Property; index: number }) {
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
  } catch (e) {}

  const coverImage = imgError
    ? `https://picsum.photos/seed/prop-${property.id ?? index}/640/480`
    : imagesArr[0] ??
      `https://picsum.photos/seed/prop-${property.id ?? index}/640/480`;

  const price = property.price
    ? `${property.currency || "SSP"} ${Number(property.price).toLocaleString()}${
        property.price_period ? `/${property.price_period.replace("per_", "")}` : ""
      }`
    : "Price on request";

  const location = [property.city, property.address].filter(Boolean).join(", ") || "South Sudan";

  // Deterministic rating per property
  const rating = property.id
    ? (((parseInt(property.id.toString().replace(/\D/g, "").slice(-4) || "0", 10) % 15) + 85) / 20).toFixed(2)
    : "4.80";

  const propertySlug = `${(property.title || "property").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}--${property.id}`;

  return (
    <div className="group flex cursor-pointer flex-col gap-3">
      {/* Image container */}
      <div className="relative aspect-[16/10] sm:aspect-square overflow-hidden rounded-2xl">
        <Link href={`/real-estate/${propertySlug}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Featured badge — mirrors "Guest favorite" */}
        {property.is_featured ? (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-white px-3 py-1 shadow-sm">
            <Sparkles className="size-3 text-primary" />
            <span className="text-[11px] font-semibold tracking-tight text-gray-900">
              Featured
            </span>
          </div>
        ) : property.category ? (
          <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold capitalize text-white backdrop-blur-sm">
            {String(property.category)}
          </div>
        ) : null}

        {/* Wishlist heart */}
        <button
          type="button"
          onClick={() => toggleFavoriteProperty(property.id)}
          className="absolute right-3 top-3 p-1 transition-transform hover:scale-110 active:scale-90"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`size-6 stroke-[2px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-colors ${
              wishlisted ? "fill-red-500 text-red-500" : "fill-black/20 text-white"
            }`}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-start justify-between">
          <Link href={`/real-estate/${propertySlug}`}>
            <h3 className="max-w-[80%] truncate text-[14px] font-semibold text-gray-900 hover:underline">
              {property.title}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Star className="size-3 fill-gray-900 text-gray-900" />
            <span className="text-[13px] font-light text-gray-900">{rating}</span>
          </div>
        </div>

        <p className="flex items-center gap-1 truncate text-[13px] text-gray-500">
          <MapPin className="size-3 shrink-0" />
          {location}
        </p>

        {property.status === "active" ? (
          <p className="mt-0.5 text-[13px] text-gray-900">
            <span className="font-semibold">{price}</span>
          </p>
        ) : (
          <p className="mt-0.5 text-[13px]">
            <span className="font-semibold text-gray-900">{price}</span>
            <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-500">
              {String(property.status)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
