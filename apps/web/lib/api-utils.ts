interface PaginatedData {
  total?: number;
  total_items?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  pages?: number;
  meta?: {
    total?: number;
    page?: number;
    pages?: number;
  };
  data?: unknown[];
}

interface ListMeta {
  total: number;
  page: number;
  pages: number;
  page_size: number;
}

export function getListMeta(data: PaginatedData | undefined | null): ListMeta {
  if (!data) {
    return { total: 0, page: 1, pages: 1, page_size: 12 };
  }

  const total = data.total ?? data.total_items ?? data.meta?.total ?? 0;
  const page = data.page ?? data.meta?.page ?? 1;
  const page_size = data.page_size ?? 12;
  const pages =
    data.pages ??
    data.total_pages ??
    data.meta?.pages ??
    (total > 0 ? Math.ceil(total / page_size) : 1);

  return { total, page, pages, page_size };
}
