import Fuse from "fuse.js";
import { movieQuotes } from "./quotes-db";
import { MovieQuote, SearchResult, Movie } from "@/types";

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
  quoteMatches: QuoteMatch[],
  tmdbResults: Movie[]
): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<number>();

  for (const match of quoteMatches) {
    const tmdbMovie = tmdbResults.find((m) => m.id === match.quote.movieId);
    if (tmdbMovie) {
      results.push({
        movie: tmdbMovie,
        confidence: match.score,
        matchSource: "combined",
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
      });
      seen.add(match.quote.movieId);
    }
  }

  for (const movie of tmdbResults) {
    if (!seen.has(movie.id)) {
      results.push({
        movie,
        confidence: 0.3,
        matchSource: "tmdb",
      });
      seen.add(movie.id);
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 10);
}
