"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MovieDetail, WatchProviders, Movie, SearchResult } from "@/types";
import { getImageUrl, getBackdropUrl, withAffiliate } from "@/lib/tmdb";
import { formatTimestamp } from "@/lib/search";
import { useWatchlist } from "@/hooks/useWatchlist";

interface MovieModalProps {
  movieId: number | null;
  fallback?: SearchResult | null;
  onClose: () => void;
}

interface MovieData {
  details: MovieDetail;
  providers: WatchProviders | null;
  similar: Movie[];
}

export default function MovieModal({ movieId, fallback, onClose }: MovieModalProps) {
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSaved, toggle } = useWatchlist();

  useEffect(() => {
    if (!movieId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/movie/${movieId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch");
        return json;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load movie details"))
      .finally(() => setLoading(false));
  }, [movieId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = movieId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [movieId]);

  const ProviderRow = ({ title, list }: { title: string; list?: WatchProviders["flatrate"] }) =>
    list && list.length > 0 ? (
      <div>
        <p className="label text-soft mb-2">{title}</p>
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <div key={p.provider_id} className="flex items-center gap-2 border border-line bg-paper px-2.5 py-1.5">
              <Image src={getImageUrl(p.logo_path, "w92")} alt={p.provider_name} width={20} height={20} className="rounded-sm" />
              <span className="text-xs text-ink">{p.provider_name}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <AnimatePresence>
      {movieId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-sm p-4 sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-full max-w-3xl bg-paper border border-line-strong shadow-[0_30px_80px_-20px_rgba(28,24,19,0.4)]"
          >
            {loading && (
              <div className="grid place-items-center py-32">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
            )}

            {error && !loading && (
              <div className="p-7 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-serif text-3xl text-ink">{fallback?.movie.title || "Details"}</h2>
                  <button onClick={onClose} className="text-soft hover:text-accent shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {fallback?.matchedLine && (
                  <div className="border-l-2 border-accent pl-4 py-1">
                    <p className="label text-soft mb-1">Matched line</p>
                    <p className="font-serif text-lg text-ink italic">“{fallback.matchedLine}”</p>
                    {fallback.timestampMs != null && fallback.timestampMs > 0 && (
                      <p className="font-mono text-xs text-accent mt-1">at {formatTimestamp(fallback.timestampMs)}</p>
                    )}
                  </div>
                )}

                <div className="border border-accent/30 bg-accent-soft/50 p-4">
                  <p className="text-accent-deep text-sm">{error}</p>
                  <p className="text-soft text-xs mt-2">
                    Get a free key at{" "}
                    <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      themoviedb.org/settings/api
                    </a>{" "}
                    and set <code>TMDB_API_KEY</code> in <code>.env.local</code>.
                  </p>
                </div>
              </div>
            )}

            {data && !loading && (
              <>
                {/* Backdrop */}
                <div className="relative h-56 sm:h-72">
                  {data.details.backdrop_path ? (
                    <Image src={getBackdropUrl(data.details.backdrop_path)} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                  ) : (
                    <div className="w-full h-full bg-paper-dim" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/30 to-transparent" />

                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 grid place-items-center bg-paper border border-line text-ink hover:text-accent transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-7 pb-7 -mt-16 relative">
                  <div className="flex gap-5 items-end">
                    <div className="relative w-28 h-42 shrink-0 overflow-hidden border border-line bg-paper-dim shadow-lg">
                      {data.details.poster_path ? (
                        <Image src={getImageUrl(data.details.poster_path, "w342")} alt={data.details.title} width={112} height={168} className="object-cover w-full h-full" />
                      ) : null}
                    </div>
                    <div className="pb-1">
                      <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">{data.details.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-soft mt-1">
                        <span>{data.details.release_date?.split("-")[0]}</span>
                        {data.details.runtime ? (
                          <>
                            <span>·</span>
                            <span>{Math.floor(data.details.runtime / 60)}h {data.details.runtime % 60}m</span>
                          </>
                        ) : null}
                        {data.details.vote_average > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono">★ {data.details.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {data.details.tagline && (
                    <p className="font-serif italic text-soft mt-5 text-lg">“{data.details.tagline}”</p>
                  )}

                  {/* Matched line from search */}
                  {fallback?.matchedLine && (
                    <div className="border-l-2 border-accent pl-4 py-1 mt-5">
                      <p className="label text-soft mb-1">Your line</p>
                      <p className="text-ink italic">“{fallback.matchedLine}”</p>
                      {fallback.timestampMs != null && fallback.timestampMs > 0 && (
                        <p className="font-mono text-xs text-accent mt-1">around {formatTimestamp(fallback.timestampMs)}</p>
                      )}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={() => toggle(data.details)}
                    className={`mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-colors ${
                      isSaved(data.details.id)
                        ? "bg-accent border-accent text-white"
                        : "bg-paper border-line-strong text-ink hover:border-accent"
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isSaved(data.details.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {isSaved(data.details.id) ? "Saved" : "Save to watchlist"}
                  </button>

                  {/* Genres */}
                  {data.details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {data.details.genres.map((genre) => (
                        <span key={genre.id} className="border border-line px-3 py-1 text-xs text-soft">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Overview */}
                  {data.details.overview && (
                    <div className="mt-6">
                      <p className="label text-soft mb-2">Synopsis</p>
                      <p className="text-ink/80 text-sm leading-relaxed">{data.details.overview}</p>
                    </div>
                  )}

                  {/* Where to watch */}
                  {data.providers && (
                    <div className="mt-7 space-y-4">
                      <p className="font-serif text-xl text-ink">Where to watch</p>
                      <ProviderRow title="Stream" list={data.providers.flatrate} />
                      <ProviderRow title="Rent" list={data.providers.rent} />
                      <ProviderRow title="Buy" list={data.providers.buy} />
                      {data.providers.link && (
                        <a
                          href={withAffiliate(data.providers.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline text-sm"
                        >
                          View all options →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Similar */}
                  {data.similar.length > 0 && (
                    <div className="mt-8">
                      <p className="font-serif text-xl text-ink mb-3">You might also mean</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {data.similar.slice(0, 6).map((movie) => (
                          <div key={movie.id} className="relative aspect-2/3 overflow-hidden border border-line bg-paper-dim">
                            {movie.poster_path ? (
                              <Image src={getImageUrl(movie.poster_path, "w185")} alt={movie.title} fill className="object-cover" sizes="100px" />
                            ) : (
                              <span className="absolute inset-0 grid place-items-center text-[10px] text-soft text-center px-1">{movie.title}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMDb */}
                  {data.details.imdb_id && (
                    <div className="mt-7 pt-5 border-t border-line">
                      <a
                        href={`https://www.imdb.com/title/${data.details.imdb_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-ink hover:text-accent transition-colors"
                      >
                        <span className="font-serif font-bold">IMDb</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
