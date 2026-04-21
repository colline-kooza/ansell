"use client";

export const PENDING_OWNER_APPLICATION_KEY = "ansell_pending_owner_application";
export const PENDING_COMPANY_APPLICATION_KEY = "ansell_pending_company_application";

type StorageReader = Pick<Storage, "getItem"> | null | undefined;

function getStorage(source?: StorageReader) {
  if (source) return source;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function normalizeRole(role?: string | null) {
  return role?.toLowerCase().replace(/[_-\s]/g, "") ?? "";
}

export function isAdminRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "superadmin" || normalizedRole === "admin" || normalizedRole.includes("admin");
}

export function isOwnerRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "owner" || normalizedRole === "propertyowner";
}

export function isCompanyRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "company" || normalizedRole === "companyowner";
}

export function getPendingApplicationHref(source?: StorageReader) {
  const storage = getStorage(source);
  if (!storage) return null;
  if (storage.getItem(PENDING_COMPANY_APPLICATION_KEY)) return "/company/dashboard";
  if (storage.getItem(PENDING_OWNER_APPLICATION_KEY)) return "/owner/dashboard";
  return null;
}

export function getAuthenticatedHomeHref(role?: string | null, source?: StorageReader) {
  if (isAdminRole(role)) return "/admin/dashboard";
  if (isCompanyRole(role)) return "/company/dashboard";
  if (isOwnerRole(role)) return "/owner/dashboard";
  return getPendingApplicationHref(source) ?? "/user/dashboard";
}
