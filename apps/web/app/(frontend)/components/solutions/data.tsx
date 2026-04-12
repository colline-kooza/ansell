import type { ReactNode } from "react";
import {
  Building2,
  Briefcase,
  ScrollText,
  GraduationCap,
  Store,
  Newspaper,
  Globe,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  Search,
  Bell,
  FileText,
  Map,
  Star,
  BookOpen,
  Award,
  Database,
  MessageSquare,
} from "lucide-react";

export interface SolutionSection {
  id: string;
  sidebarName: string;
  tagline: string;
  title: string;
  description: string;
  href: string;
  features: { icon: ReactNode; title: string }[];
  services: { icon: ReactNode; name: string }[];
}

export const solutionSections: SolutionSection[] = [
  {
    id: "real-estate-platform",
    sidebarName: "Real Estate",
    tagline: "Property listings & leases across South Sudan",
    title: "Real Estate & Property Platform",
    href: "/real-estate",
    description:
      "A verified marketplace for buying, renting, and leasing property across South Sudan. From residential apartments in Juba to commercial land in Wau — every listing is submitted and reviewed on ANASELL.",
    features: [
      { icon: <Building2 className="size-4" />, title: "Verified property listings" },
      { icon: <Map className="size-4" />, title: "City-level search and filtering" },
      { icon: <ShieldCheck className="size-4" />, title: "Owner identity verification" },
    ],
    services: [
      { icon: <Building2 className="size-4" />, name: "Rentals" },
      { icon: <Map className="size-4" />, name: "Land for Sale" },
      { icon: <Store className="size-4" />, name: "Commercial" },
      { icon: <Building2 className="size-4" />, name: "Apartments" },
      { icon: <Search className="size-4" />, name: "Property Search" },
    ],
  },
  {
    id: "job-board-platform",
    sidebarName: "Job Board",
    tagline: "NGO, UN, government & private sector roles",
    title: "Job Board & Career Centre",
    href: "/job-board",
    description:
      "Browse job openings from leading employers in South Sudan — from WFP and ICRC to NilePet and Juba Tech Hub. Post your CV, track applications, and get notified about new roles that match your profile.",
    features: [
      { icon: <Briefcase className="size-4" />, title: "Full-time, contract, and NGO roles" },
      { icon: <Bell className="size-4" />, title: "Job alert notifications" },
      { icon: <Users className="size-4" />, title: "Employer profile pages" },
    ],
    services: [
      { icon: <Briefcase className="size-4" />, name: "NGO / UN Jobs" },
      { icon: <Globe className="size-4" />, name: "Government Jobs" },
      { icon: <Store className="size-4" />, name: "Private Sector" },
      { icon: <FileText className="size-4" />, name: "CV Upload" },
      { icon: <Bell className="size-4" />, name: "Job Alerts" },
    ],
  },
  {
    id: "tenders-platform",
    sidebarName: "Tenders",
    tagline: "Government & NGO procurement opportunities",
    title: "Public Tenders & Procurement",
    href: "/tenders",
    description:
      "Never miss a government or NGO procurement opportunity. ANASELL aggregates open tenders from South Sudan ministries, UN agencies, and INGOs — with deadline tracking and supplier registration built in.",
    features: [
      { icon: <ScrollText className="size-4" />, title: "Open and upcoming tenders" },
      { icon: <Bell className="size-4" />, title: "Deadline notifications" },
      { icon: <ShieldCheck className="size-4" />, title: "Verified supplier registration" },
    ],
    services: [
      { icon: <ScrollText className="size-4" />, name: "Government" },
      { icon: <Globe className="size-4" />, name: "NGO / INGO" },
      { icon: <Store className="size-4" />, name: "Suppliers" },
      { icon: <Bell className="size-4" />, name: "Alerts" },
      { icon: <Database className="size-4" />, name: "Archive" },
    ],
  },
  {
    id: "courses-platform",
    sidebarName: "Courses",
    tagline: "Professional training & certification in SSD",
    title: "Courses & Professional Training",
    href: "/courses",
    description:
      "Find accredited courses, certifications, and vocational training from universities and institutes in South Sudan. From project management and IT to construction safety and business finance.",
    features: [
      { icon: <GraduationCap className="size-4" />, title: "Accredited certifications" },
      { icon: <BookOpen className="size-4" />, title: "Technical and business courses" },
      { icon: <Award className="size-4" />, title: "Verified course providers" },
    ],
    services: [
      { icon: <GraduationCap className="size-4" />, name: "Certifications" },
      { icon: <Zap className="size-4" />, name: "Technical Skills" },
      { icon: <BarChart3 className="size-4" />, name: "Business" },
      { icon: <BookOpen className="size-4" />, name: "Online" },
      { icon: <Award className="size-4" />, name: "Vocational" },
    ],
  },
  {
    id: "companies-platform",
    sidebarName: "Companies",
    tagline: "Business directory for South Sudan",
    title: "Verified Business Directory",
    href: "/companies",
    description:
      "A trusted directory of companies, NGOs, and government agencies active in South Sudan. Explore contact information, industry tags, project history, and ANASELL-verified status.",
    features: [
      { icon: <Store className="size-4" />, title: "Verified business profiles" },
      { icon: <Star className="size-4" />, title: "Industry classification tags" },
      { icon: <MessageSquare className="size-4" />, title: "Direct contact and enquiry" },
    ],
    services: [
      { icon: <Store className="size-4" />, name: "Private Sector" },
      { icon: <Globe className="size-4" />, name: "NGOs & INGOs" },
      { icon: <ShieldCheck className="size-4" />, name: "Verified" },
      { icon: <Database className="size-4" />, name: "Directory" },
      { icon: <Search className="size-4" />, name: "Search" },
    ],
  },
  {
    id: "news-platform",
    sidebarName: "News",
    tagline: "Business news and market intelligence",
    title: "News & Market Intelligence",
    href: "/news",
    description:
      "Stay informed on South Sudan business, regulatory, and economic news. ANASELL curates local market intelligence — from tender announcements and policy updates to infrastructure and investment news.",
    features: [
      { icon: <Newspaper className="size-4" />, title: "Local business and policy news" },
      { icon: <BarChart3 className="size-4" />, title: "Market intelligence reports" },
      { icon: <Bell className="size-4" />, title: "Tender digest and alerts" },
    ],
    services: [
      { icon: <Newspaper className="size-4" />, name: "Business" },
      { icon: <ScrollText className="size-4" />, name: "Tenders" },
      { icon: <Globe className="size-4" />, name: "Policy" },
      { icon: <BarChart3 className="size-4" />, name: "Markets" },
      { icon: <Zap className="size-4" />, name: "Infrastructure" },
    ],
  },
];
