const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  technology: "Technology",
  real_estate: "Real Estate",
  jobs: "Jobs & Careers",
  tenders: "Tenders",
  economy: "Economy",
  infrastructure: "Infrastructure",
  health: "Health",
  education: "Education",
  politics: "Politics",
  humanitarian: "Humanitarian",
  agriculture: "Agriculture",
  energy: "Energy",
  finance: "Finance",
  general: "General",
};

export function getArticleCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
