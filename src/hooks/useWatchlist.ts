"use client";

import { useState, useEffect, useCallback } from "react";
import { Movie } from "@/types";

const STORAGE_KEY = "scenesnap_watchlist";

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  addedAt: number;
}

function readStorage(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    setItems(readStorage());

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: WatchlistItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable; ignore
    }
  }, []);

  const isSaved = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items]
  );

  const toggle = useCallback(
    (movie: Movie) => {
      const exists = items.some((i) => i.id === movie.id);
      if (exists) {
        persist(items.filter((i) => i.id !== movie.id));
      } else {
        persist([
          {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            addedAt: Date.now(),
          },
          ...items,
        ]);
      }
    },
    [items, persist]
  );

  return { items, isSaved, toggle };
}
