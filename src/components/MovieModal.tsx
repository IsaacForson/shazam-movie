"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MovieDetail, WatchProviders, Movie, GENRE_MAP } from "@/types";
import { getImageUrl, getBackdropUrl } from "@/lib/tmdb";

interface MovieModalProps {
  movieId: number | null;
  onClose: () => void;
}

interface MovieData {
  details: MovieDetail;
  providers: WatchProviders | null;
  similar: Movie[];
}

export default function MovieModal({ movieId, onClose }: MovieModalProps) {
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/movie/${movieId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Could not load movie details"))
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
    if (movieId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [movieId]);

  return (
    <AnimatePresence>
      {movieId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-12 pb-12"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl"
          >
            {loading && (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-24 px-6">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={onClose} className="mt-4 text-gray-400 hover:text-white text-sm">
                  Close
                </button>
              </div>
            )}

            {data && !loading && (
              <>
                {/* Backdrop */}
                <div className="relative h-64 sm:h-80">
                  {data.details.backdrop_path ? (
                    <Image
                      src={getBackdropUrl(data.details.backdrop_path)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-5">
                    <div className="relative w-28 h-42 shrink-0 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10">
                      {data.details.poster_path ? (
                        <Image
                          src={getImageUrl(data.details.poster_path, "w342")}
                          alt={data.details.title}
                          width={112}
                          height={168}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-28 h-[168px] bg-gray-800 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {data.details.title}
                      </h2>
                      {data.details.tagline && (
                        <p className="text-gray-400 text-sm italic mt-1">{data.details.tagline}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-gray-300 text-sm">
                          {data.details.release_date?.split("-")[0]}
                        </span>
                        {data.details.runtime && (
                          <>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-300 text-sm">
                              {Math.floor(data.details.runtime / 60)}h {data.details.runtime % 60}m
                            </span>
                          </>
                        )}
                        {data.details.vote_average > 0 && (
                          <>
                            <span className="text-gray-600">·</span>
                            <span className="flex items-center gap-1 text-sm">
                              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-white font-medium">
                                {data.details.vote_average.toFixed(1)}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Genres */}
                  {data.details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.details.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Overview */}
                  {data.details.overview && (
                    <div>
                      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                        Overview
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {data.details.overview}
                      </p>
                    </div>
                  )}

                  {/* Where to Watch */}
                  {data.providers && (
                    <div>
                      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Where to Watch
                      </h3>
                      <div className="space-y-3">
                        {data.providers.flatrate && data.providers.flatrate.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2">Stream</p>
                            <div className="flex flex-wrap gap-2">
                              {data.providers.flatrate.map((p) => (
                                <div
                                  key={p.provider_id}
                                  className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2"
                                >
                                  <Image
                                    src={getImageUrl(p.logo_path, "w92")}
                                    alt={p.provider_name}
                                    width={24}
                                    height={24}
                                    className="rounded"
                                  />
                                  <span className="text-gray-300 text-xs">{p.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.providers.rent && data.providers.rent.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2">Rent</p>
                            <div className="flex flex-wrap gap-2">
                              {data.providers.rent.map((p) => (
                                <div
                                  key={p.provider_id}
                                  className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2"
                                >
                                  <Image
                                    src={getImageUrl(p.logo_path, "w92")}
                                    alt={p.provider_name}
                                    width={24}
                                    height={24}
                                    className="rounded"
                                  />
                                  <span className="text-gray-300 text-xs">{p.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.providers.buy && data.providers.buy.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2">Buy</p>
                            <div className="flex flex-wrap gap-2">
                              {data.providers.buy.map((p) => (
                                <div
                                  key={p.provider_id}
                                  className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2"
                                >
                                  <Image
                                    src={getImageUrl(p.logo_path, "w92")}
                                    alt={p.provider_name}
                                    width={24}
                                    height={24}
                                    className="rounded"
                                  />
                                  <span className="text-gray-300 text-xs">{p.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.providers.link && (
                          <a
                            href={data.providers.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs mt-1"
                          >
                            View all options
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Similar Movies */}
                  {data.similar.length > 0 && (
                    <div>
                      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Similar Movies
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {data.similar.slice(0, 6).map((movie) => (
                          <div key={movie.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden">
                            {movie.poster_path ? (
                              <Image
                                src={getImageUrl(movie.poster_path, "w185")}
                                alt={movie.title}
                                fill
                                className="object-cover"
                                sizes="100px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-600 text-[10px] text-center px-1">{movie.title}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                              <span className="text-white text-[10px] leading-tight line-clamp-2">
                                {movie.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMDB Link */}
                  {data.details.imdb_id && (
                    <div className="pt-2 border-t border-gray-800">
                      <a
                        href={`https://www.imdb.com/title/${data.details.imdb_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors text-sm"
                      >
                        <span className="font-bold">IMDb</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
