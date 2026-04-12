export interface IndustryShowcaseItem {
  id: string;
  name: string;
  image: string;
  imagePosition?: string;
  tags: string[];
  href: string;
}

export const INDUSTRY_SHOWCASE_START_INDEX = 1;

export const industryShowcaseItems: IndustryShowcaseItem[] = [
  {
    id: "real-estate",
    name: "Real Estate",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    imagePosition: "center",
    tags: ["Residential", "Commercial", "Land"],
    href: "/real-estate",
  },
  {
    id: "oil-energy",
    name: "Oil & Energy",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
    imagePosition: "center",
    tags: ["Petroleum", "NilePet", "Energy"],
    href: "/companies?industry=energy",
  },
  {
    id: "humanitarian",
    name: "Humanitarian",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
    imagePosition: "top",
    tags: ["WFP", "ICRC", "NGOs"],
    href: "/companies?industry=humanitarian",
  },
  {
    id: "technology",
    name: "Technology",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    imagePosition: "center",
    tags: ["IT & Tech", "Startups", "Digital"],
    href: "/companies?industry=technology",
  },
  {
    id: "agriculture",
    name: "Agriculture",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    imagePosition: "center",
    tags: ["Farming", "Agribusiness", "Livestock"],
    href: "/job-board?category=agriculture",
  },
  {
    id: "finance",
    name: "Finance & Banking",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80",
    imagePosition: "center",
    tags: ["Banking", "Microfinance", "Insurance"],
    href: "/companies?industry=finance",
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    imagePosition: "center",
    tags: ["Roads", "Construction", "Utilities"],
    href: "/tenders?category=infrastructure",
  },
  {
    id: "education",
    name: "Education",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
    imagePosition: "center",
    tags: ["Universities", "Training", "Vocational"],
    href: "/courses",
  },
];
