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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 p-5 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Watchlist</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10">
                No saved movies yet. Tap the bookmark on any result to save it.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-gray-800/40 rounded-lg p-2 cursor-pointer hover:bg-gray-800/70"
                    onClick={() => onSelect(item.id)}
                  >
                    <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-gray-800">
                      {item.poster_path ? (
                        <Image
                          src={getImageUrl(item.poster_path, "w92")}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm truncate">{item.title}</p>
                      <p className="text-gray-500 text-xs">
                        {item.release_date?.split("-")[0] || ""}
                      </p>
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
                      className="text-gray-500 hover:text-red-400 shrink-0"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
