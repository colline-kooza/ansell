"use client";

import { useAdminProperties, type Property } from "@/hooks/use-properties";
import { useOwnerApplications, type OwnerApplication } from "@/hooks/use-owner-applications";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, GripVertical, Calendar, AlertTriangle, Plus } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────── */
type KanbanStatus = "pending_review" | "active" | "approved" | "rejected";

interface KanbanItem {
  id: string;
  title: string;
  subtitle: string;
  status: KanbanStatus;
  type: "property" | "application";
  date: string;
}

/* ── Dummy data per status (fills empty columns) ────────────────── */
const DUMMY_BY_STATUS: Record<KanbanStatus, KanbanItem[]> = {
  pending_review: [
    { id: "d1", title: "3-bed Apartment – Ministries Area, Juba", subtitle: "Akuei & Sons Properties", status: "pending_review", type: "property", date: "10 Apr 2026" },
    { id: "d2", title: "Commercial Office – Hai Malakal, Juba", subtitle: "NilePet Development Ltd", status: "pending_review", type: "property", date: "09 Apr 2026" },
    { id: "d3", title: "Owner Application – James Deng Kuol", subtitle: "jdkuol@gmail.com", status: "pending_review", type: "application", date: "08 Apr 2026" },
  ],
  active: [
    { id: "d4", title: "Studio Apartment – Tongping, Juba", subtitle: "Mary Ayen Dut", status: "active", type: "property", date: "07 Apr 2026" },
    { id: "d5", title: "4-bed Villa – Hai Jalaba, Juba", subtitle: "Equatorial Homes Ltd", status: "active", type: "property", date: "06 Apr 2026" },
    { id: "d6", title: "Owner Application – Peter Lado", subtitle: "peterlado@homes.ss", status: "active", type: "application", date: "06 Apr 2026" },
  ],
  approved: [
    { id: "d7", title: "2-bed Apartment – Gudele, Juba", subtitle: "South Sudan Housing Co.", status: "approved", type: "property", date: "04 Apr 2026" },
    { id: "d8", title: "Owner Application – Grace Abuk", subtitle: "grace.abuk@mail.com", status: "approved", type: "application", date: "03 Apr 2026" },
  ],
  rejected: [
    { id: "d9", title: "Bedsitter – Munuki, Juba", subtitle: "Private Listing", status: "rejected", type: "property", date: "02 Apr 2026" },
    { id: "d10", title: "Owner Application – David Lual", subtitle: "dlual@mail.com (incomplete docs)", status: "rejected", type: "application", date: "01 Apr 2026" },
  ],
};

/* ── Helpers ────────────────────────────────────────────────────── */
function fmtDate(raw: string | undefined | null) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function propertyToItem(p: Property): KanbanItem {
  return {
    id: p.id,
    title: p.title,
    subtitle: p.owner ? `${p.owner.first_name} ${p.owner.last_name}` : "Unknown owner",
    status: (p.status as KanbanStatus) || "pending_review",
    type: "property",
    date: fmtDate(p.created_at),
  };
}

function applicationToItem(a: OwnerApplication): KanbanItem {
  return {
    id: a.id,
    title: a.user ? `${a.user.first_name} ${a.user.last_name}` : "Application",
    subtitle: a.user?.email ?? "—",
    status: (a.status as KanbanStatus) || "pending_review",

    type: "application",
    date: fmtDate(a.created_at),
  };
}

/* ── Column config ──────────────────────────────────────────────── */
const COLUMNS: {
  key: KanbanStatus;
  label: string;
  headerColor: string;
  badgeColor: string;
  countColor: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "pending_review",
    label: "Pending Review",
    headerColor: "text-amber-600",
    badgeColor: "bg-amber-50 text-amber-700 border border-amber-200",
    countColor: "bg-amber-50 text-amber-600",
    icon: (
      <div className="w-4 h-4 rounded border-2 border-amber-300 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>
    ),
  },
  {
    key: "active",
    label: "Active",
    headerColor: "text-violet-600",
    badgeColor: "bg-violet-50 text-violet-700 border border-violet-200",
    countColor: "bg-violet-50 text-violet-600",
    icon: (
      <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    key: "approved",
    label: "Approved",
    headerColor: "text-emerald-600",
    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    countColor: "bg-emerald-50 text-emerald-600",
    icon: (
      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
  },
  {
    key: "rejected",
    label: "Rejected",
    headerColor: "text-red-500",
    badgeColor: "bg-red-50 text-red-600 border border-red-200",
    countColor: "bg-red-50 text-red-500",
    icon: (
      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
];

/* ── Card ───────────────────────────────────────────────────────── */
function KanbanCard({ item, badgeColor, isDummy }: { item: KanbanItem; badgeColor: string; isDummy?: boolean }) {
  return (
    <div className={`bg-white rounded-xl p-4 border shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing group ${isDummy ? "border-dashed border-gray-200 opacity-75" : "border-gray-100"}`}>
      {/* Type tag row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            {item.type === "property" ? <Building2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {item.type === "property" ? "Listing" : "Application"}
          </span>
          {isDummy && (
            <span className="text-[8px] font-bold uppercase tracking-wide text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
              Sample
            </span>
          )}
        </div>
        <GripVertical className="h-3.5 w-3.5 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Title */}
      <h3 className="text-[13px] font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
        {item.title}
      </h3>

      {/* Subtitle */}
      <p className="text-[11px] text-gray-400 truncate mb-3">{item.subtitle}</p>

      {/* Date */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg mb-3">
        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[10px] font-semibold text-gray-500">
          Submitted: <span className="font-bold text-gray-700">{item.date}</span>
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}`}>
          {item.status.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

/* ── Board ──────────────────────────────────────────────────────── */
export function KanbanBoard() {
  const propertiesQuery = useAdminProperties({ page_size: 50 });
  const applicationsQuery = useOwnerApplications({ page_size: 50 });

  const isLoading = propertiesQuery.isLoading || applicationsQuery.isLoading;

  const liveItems: KanbanItem[] = [
    ...(propertiesQuery.data?.data ?? []).map(propertyToItem),
    ...(applicationsQuery.data?.data ?? []).map(applicationToItem),
  ];

  // Per-column: use live data if that column has any, else show dummy cards
  const liveByStatus = (status: KanbanStatus) =>
    liveItems.filter((item) => item.status === status);

  const byStatus = (status: KanbanStatus): { items: KanbanItem[]; isDummy: boolean } => {
    const live = liveByStatus(status);
    if (live.length > 0) return { items: live, isDummy: false };
    return { items: DUMMY_BY_STATUS[status], isDummy: true };
  };

  const anyDummyColumn = COLUMNS.some((col) => byStatus(col.key).isDummy);

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-8 rounded-full ml-auto" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-[140px] w-full rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Dummy data notice — only when at least one column is using sample cards */}
      {anyDummyColumn && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Some columns show <strong>sample data</strong> — they will be replaced by real submissions automatically.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => {
          const { items: colItems, isDummy } = byStatus(col.key);
          return (
            <div key={col.key} className="flex flex-col gap-4">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span>{col.icon}</span>
                  <span className={`text-sm font-bold ${col.headerColor}`}>{col.label}</span>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ml-1 ${col.countColor}`}>
                    {colItems.length}
                  </span>
                  {isDummy && (
                    <span className="text-[8px] font-bold uppercase tracking-wide text-gray-300 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md ml-0.5">
                      sample
                    </span>
                  )}
                </div>
                <button className="text-gray-300 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-4 min-h-[180px]">
                {colItems.map((item) => (
                  <KanbanCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    badgeColor={col.badgeColor}
                    isDummy={isDummy}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
