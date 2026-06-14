"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SearchResult, GENRE_MAP } from "@/types";
import { getImageUrl, withAffiliate } from "@/lib/tmdb";
import { formatTimestamp } from "@/lib/search";
import { useWatchlist } from "@/hooks/useWatchlist";

interface MovieCardProps {
  result: SearchResult;
  index: number;
  onClick: (result: SearchResult) => void;
}

export default function MovieCard({ result, index, onClick }: MovieCardProps) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(result.movie.id);
  const { movie, confidence, matchSource, matchedLine, timestampMs, watchProviders } = result;
  const year = movie.release_date?.split("-")[0] || "N/A";
  const genres = movie.genre_ids
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const posterUrl = getImageUrl(movie.poster_path, "w342");

  const confidenceLabel =
    confidence >= 0.8
      ? "High Match"
      : confidence >= 0.5
        ? "Good Match"
        : confidence >= 0.3
          ? "Possible Match"
          : "Related";

  const confidenceColor =
    confidence >= 0.8
      ? "text-green-400 bg-green-400/10"
      : confidence >= 0.5
        ? "text-blue-400 bg-blue-400/10"
        : confidence >= 0.3
          ? "text-yellow-400 bg-yellow-400/10"
          : "text-gray-400 bg-gray-400/10";

  const hasDialogueMatch =
    matchSource === "subtitles" ||
    matchSource === "quotes" ||
    matchSource === "combined";

  const streamingProviders = watchProviders?.flatrate?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={() => onClick(result)}
      className="group cursor-pointer bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {movie.poster_path ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confidenceColor}`}>
            {confidenceLabel}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(movie);
            }}
            aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              saved ? "bg-purple-600 text-white" : "bg-black/60 text-gray-300 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {timestampMs != null && timestampMs > 0 && (
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded-full">
            <span className="text-white text-[10px] font-mono">{formatTimestamp(timestampMs)}</span>
          </div>
        )}

        {rating && !timestampMs && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white text-xs font-medium">{rating}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-300 text-xs">{year}</span>
            {genres.length > 0 && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400 text-xs">{genres.join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {(hasDialogueMatch || streamingProviders.length > 0) && (
        <div className="px-3 py-2 border-t border-gray-800/50 space-y-1.5">
          {matchedLine && (
            <p className="text-gray-400 text-[11px] line-clamp-2 italic">
              &ldquo;{matchedLine}&rdquo;
            </p>
          )}
          {streamingProviders.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 text-[10px]">Watch on</span>
              {streamingProviders.map((p) => (
                <span
                  key={p.provider_id}
                  className="text-purple-400 text-[10px] bg-purple-400/10 px-1.5 py-0.5 rounded"
                >
                  {p.provider_name}
                </span>
              ))}
              {watchProviders?.link && (
                <a
                  href={withAffiliate(watchProviders.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-purple-400 text-[10px] hover:underline ml-auto"
                >
                  See all
                </a>
              )}
            </div>
          )}
          {!matchedLine && hasDialogueMatch && (
            <p className="text-purple-400 text-[11px] flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Matched by dialogue
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
