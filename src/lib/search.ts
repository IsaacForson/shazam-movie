import Fuse from "fuse.js";
import { movieQuotes } from "./quotes-db";
import { MovieQuote, SearchResult, Movie, WatchProviders } from "@/types";
import { SubtitleMatch } from "./subtitle-search";

const fuse = new Fuse(movieQuotes, {
  keys: ["quote"],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 3,
  ignoreLocation: true,
});

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "don", "now", "and", "but", "or", "if", "while", "about", "up",
    "that", "this", "it", "i", "me", "my", "we", "you", "your", "he",
    "she", "him", "her", "they", "them", "what", "which", "who", "whom",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

export interface QuoteMatch {
  quote: MovieQuote;
  score: number;
}

export function searchQuotes(text: string): QuoteMatch[] {
  if (!text || text.trim().length < 3) return [];

  const results = fuse.search(text);

  const seen = new Set<number>();
  const matches: QuoteMatch[] = [];

  for (const result of results) {
    if (seen.has(result.item.movieId)) continue;
    seen.add(result.item.movieId);
    matches.push({
      quote: result.item,
      score: 1 - (result.score || 0),
    });
  }

  return matches.slice(0, 10);
}

export function getSearchKeywords(text: string): string[] {
  return extractKeywords(text);
}

export function mergeResults(
  subtitleMatches: SubtitleMatch[],
  quoteMatches: QuoteMatch[],
  tmdbResults: Movie[],
  watchProvidersMap?: Map<number, WatchProviders | null>
): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<number>();

  for (const match of subtitleMatches) {
    const tmdbMovie = tmdbResults.find((m) => m.id === match.tmdbId);
    if (tmdbMovie) {
      results.push({
        movie: tmdbMovie,
        confidence: match.confidence,
        matchSource: "subtitles",
        matchedLine: match.matchedLine,
        timestampMs: match.startMs,
        watchProviders: watchProvidersMap?.get(match.tmdbId) ?? undefined,
      });
      seen.add(tmdbMovie.id);
    } else {
      results.push({
        movie: {
          id: match.tmdbId,
          title: match.title,
          overview: "",
          poster_path: null,
          backdrop_path: null,
          release_date: "",
          vote_average: 0,
          vote_count: 0,
          genre_ids: [],
          popularity: 0,
          original_language: "en",
        },
        confidence: match.confidence,
        matchSource: "subtitles",
        matchedLine: match.matchedLine,
        timestampMs: match.startMs,
      });
      seen.add(match.tmdbId);
    }
  }

  for (const match of quoteMatches) {
    if (seen.has(match.quote.movieId)) {
      const existing = results.find((r) => r.movie.id === match.quote.movieId);
      if (existing && match.score > existing.confidence) {
        existing.confidence = Math.max(existing.confidence, match.score);
        existing.matchSource = "combined";
        existing.matchedLine = match.quote.quote;
      }
      continue;
    }

    const tmdbMovie = tmdbResults.find((m) => m.id === match.quote.movieId);
    if (tmdbMovie) {
      results.push({
        movie: tmdbMovie,
        confidence: match.score,
        matchSource: "combined",
        matchedLine: match.quote.quote,
        watchProviders: watchProvidersMap?.get(match.quote.movieId) ?? undefined,
      });
      seen.add(tmdbMovie.id);
    } else {
      results.push({
        movie: {
          id: match.quote.movieId,
          title: match.quote.title,
          overview: "",
          poster_path: null,
          backdrop_path: null,
          release_date: `${match.quote.year}-01-01`,
          vote_average: 0,
          vote_count: 0,
          genre_ids: [],
          popularity: 0,
          original_language: "en",
        },
        confidence: match.score,
        matchSource: "quotes",
        matchedLine: match.quote.quote,
      });
      seen.add(match.quote.movieId);
    }
  }

  for (const movie of tmdbResults) {
    if (!seen.has(movie.id)) {
      results.push({
        movie,
        confidence: 0.2,
        matchSource: "tmdb",
        watchProviders: watchProvidersMap?.get(movie.id) ?? undefined,
      });
      seen.add(movie.id);
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 10);
}

export function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
