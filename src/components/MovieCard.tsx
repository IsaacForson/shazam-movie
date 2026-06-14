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
  rank?: number;
  onClick: (result: SearchResult) => void;
}

export default function MovieCard({ result, index, rank, onClick }: MovieCardProps) {
  const { isSaved, toggle } = useWatchlist();
  const { movie, confidence, matchSource, matchedLine, timestampMs, watchProviders } = result;
  const saved = isSaved(movie.id);

  const year = movie.release_date?.split("-")[0] || "—";
  const genres = movie.genre_ids
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const posterUrl = getImageUrl(movie.poster_path, "w342");

  const confidenceLabel =
    confidence >= 0.8
      ? "Strong match"
      : confidence >= 0.5
        ? "Good match"
        : confidence >= 0.3
          ? "Possible"
          : "Related";

  const hasDialogueMatch =
    matchSource === "subtitles" || matchSource === "quotes" || matchSource === "combined";

  const streamingProviders = watchProviders?.flatrate?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onClick={() => onClick(result)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-2/3 overflow-hidden bg-paper-dim border border-line">
        {movie.poster_path ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full grid place-items-center p-4">
            <span className="font-serif text-center text-ink/40 leading-tight">{movie.title}</span>
          </div>
        )}

        {rank != null && (
          <span className="absolute top-0 left-0 bg-paper text-ink font-mono text-xs px-2 py-1 border-r border-b border-line">
            {String(rank).padStart(2, "0")}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(movie);
          }}
          aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
          className={`absolute top-0 right-0 w-9 h-9 grid place-items-center border-l border-b border-line transition-colors ${
            saved ? "bg-accent text-white" : "bg-paper/90 text-ink hover:text-accent"
          }`}
        >
          <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {timestampMs != null && timestampMs > 0 && (
          <span className="absolute bottom-0 left-0 bg-ink text-paper font-mono text-[11px] px-2 py-1">
            {formatTimestamp(timestampMs)}
          </span>
        )}
      </div>

      {/* Caption block */}
      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight text-ink line-clamp-2 group-hover:text-accent transition-colors">
            {movie.title}
          </h3>
          {rating && <span className="font-mono text-xs text-soft shrink-0">★ {rating}</span>}
        </div>

        <p className="text-xs text-soft mt-1">
          {year}
          {genres.length > 0 && <span> · {genres.join(", ")}</span>}
        </p>

        <div className="mt-2 h-px bg-line" />

        <p className="label text-accent mt-2">{confidenceLabel}</p>

        {matchedLine && (
          <p className="text-xs text-soft italic mt-1.5 line-clamp-2">“{matchedLine}”</p>
        )}

        {!matchedLine && hasDialogueMatch && (
          <p className="text-xs text-soft mt-1.5">Matched by dialogue</p>
        )}

        {streamingProviders.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {streamingProviders.map((p) => (
              <span key={p.provider_id} className="text-[10px] text-ink border border-line px-1.5 py-0.5">
                {p.provider_name}
              </span>
            ))}
            {watchProviders?.link && (
              <a
                href={withAffiliate(watchProviders.link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-accent hover:underline ml-auto"
              >
                Where to watch →
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
