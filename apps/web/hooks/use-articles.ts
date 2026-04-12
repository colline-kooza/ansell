import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover_image_url?: string;
  category: string;
  published_at?: string;
  created_at: string;
  read_time_minutes: number;
  is_featured?: boolean;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  [key: string]: unknown;
}

export interface ArticleCategory {
  category: string;
  label: string;
  count: number;
}

interface ArticlesResponse {
  data: Article[];
  meta: {
    total: number;
    page: number;
    pages: number;
  };
}

interface UseArticlesOptions {
  category?: string;
  sort?: "latest" | "popular" | "featured";
  featured?: boolean;
  page?: number;
  page_size?: number;
  search?: string;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ansell_auth_token");
}

async function fetchArticles(
  options: UseArticlesOptions,
): Promise<ArticlesResponse> {
  const params = new URLSearchParams();

  if (options.category) params.set("category", options.category);
  if (options.sort) params.set("sort", options.sort);
  if (options.featured != null)
    params.set("featured", String(options.featured));
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.search) params.set("search", options.search);

  const token = getAuthToken();
  const response = await fetch(
    `${buildApiUrl("articles")}?${params.toString()}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.status}`);
  }

  return response.json() as Promise<ArticlesResponse>;
}

async function fetchArticleCategories(): Promise<ArticleCategory[]> {
  const response = await fetch(buildApiUrl("articles/categories"));

  if (!response.ok) {
    throw new Error(`Failed to fetch article categories: ${response.status}`);
  }
  const json = await response.json();
  return (json.data ?? []) as ArticleCategory[];
}

export function useArticles(options: UseArticlesOptions = {}) {
  return useQuery({
    queryKey: ["articles", options],
    queryFn: () => fetchArticles(options),
  });
}

export function useArticleCategories() {
  return useQuery({
    queryKey: ["article-categories"],
    queryFn: fetchArticleCategories,
    staleTime: 5 * 60 * 1000,
  });
}
export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`articles/${slug}`));
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
      }
      const json = await response.json();
      return json.data as Article;
    },
    enabled: !!slug,
  });
}
