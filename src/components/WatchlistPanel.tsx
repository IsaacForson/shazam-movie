"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useWatchlist } from "@/hooks/useWatchlist";
import { getImageUrl } from "@/lib/tmdb";

interface WatchlistPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (movieId: number) => void;
}

export default function WatchlistPanel({ open, onClose, onSelect }: WatchlistPanelProps) {
  const { items, toggle } = useWatchlist();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-paper border-l border-line-strong flex flex-col"
          >
            <div className="flex items-baseline justify-between px-6 h-16 border-b border-line shrink-0">
              <h2 className="font-serif text-2xl text-ink">Watchlist</h2>
              <button onClick={onClose} className="text-soft hover:text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="text-soft text-sm text-center mt-16 px-6">
                  Nothing saved yet. Tap the bookmark on any result to keep it here.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 py-3 cursor-pointer group"
                      onClick={() => onSelect(item.id)}
                    >
                      <div className="relative w-11 h-16 shrink-0 overflow-hidden border border-line bg-paper-dim">
                        {item.poster_path ? (
                          <Image src={getImageUrl(item.poster_path, "w92")} alt={item.title} fill className="object-cover" sizes="44px" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-base text-ink leading-tight truncate group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-soft mt-0.5">{item.release_date?.split("-")[0] || ""}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle({
                            id: item.id,
                            title: item.title,
                            poster_path: item.poster_path,
                            release_date: item.release_date,
                            overview: "",
                            backdrop_path: null,
                            vote_average: 0,
                            vote_count: 0,
                            genre_ids: [],
                            popularity: 0,
                            original_language: "en",
                          });
                        }}
                        className="text-soft hover:text-accent shrink-0"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
