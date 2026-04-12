import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserStore {
  // Favourites
  favoritePropertyIds: string[];
  favoriteJobIds: string[];

  // News preferences (category slugs)
  newsPreferences: string[];

  // Actions
  toggleFavoriteProperty: (id: string) => void;
  toggleFavoriteJob: (id: string) => void;
  isFavoriteProperty: (id: string) => boolean;
  isFavoriteJob: (id: string) => boolean;

  setNewsPreferences: (categories: string[]) => void;
  toggleNewsPreference: (category: string) => void;
  isNewsPreferred: (category: string) => boolean;

  clearAll: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      favoritePropertyIds: [],
      favoriteJobIds: [],
      newsPreferences: [],

      toggleFavoriteProperty: (id) =>
        set((s) => ({
          favoritePropertyIds: s.favoritePropertyIds.includes(id)
            ? s.favoritePropertyIds.filter((x) => x !== id)
            : [...s.favoritePropertyIds, id],
        })),

      toggleFavoriteJob: (id) =>
        set((s) => ({
          favoriteJobIds: s.favoriteJobIds.includes(id)
            ? s.favoriteJobIds.filter((x) => x !== id)
            : [...s.favoriteJobIds, id],
        })),

      isFavoriteProperty: (id) => get().favoritePropertyIds.includes(id),
      isFavoriteJob: (id) => get().favoriteJobIds.includes(id),

      setNewsPreferences: (categories) => set({ newsPreferences: categories }),

      toggleNewsPreference: (category) =>
        set((s) => ({
          newsPreferences: s.newsPreferences.includes(category)
            ? s.newsPreferences.filter((c) => c !== category)
            : [...s.newsPreferences, category],
        })),

      isNewsPreferred: (category) => get().newsPreferences.includes(category),

      clearAll: () =>
        set({ favoritePropertyIds: [], favoriteJobIds: [], newsPreferences: [] }),
    }),
    {
      name: "ansell-user-store",
      version: 1,
    }
  )
);
