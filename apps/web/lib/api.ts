const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ansell-api.collinzdev.com/api";

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const segment = path.replace(/^\//, "");
  return `${base}/${segment}`;
}

export { API_BASE_URL };
