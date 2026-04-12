export const PROPERTY_CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "rental", label: "Rentals" },
  { value: "land", label: "Land for Sale" },
  { value: "commercial", label: "Commercial" },
  { value: "apartment", label: "Apartments" },
] as const;

export type PropertyCategory =
  (typeof PROPERTY_CATEGORY_OPTIONS)[number]["value"];

export const PROPERTY_CATEGORY_LABELS: Record<
  Exclude<PropertyCategory, "all">,
  string
> = {
  rental: "Rentals",
  land: "Land for Sale",
  commercial: "Commercial",
  apartment: "Apartments",
};

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  inactive: "Inactive",
};
