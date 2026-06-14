export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
}

export interface MovieDetail extends Movie {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
  homepage: string;
  imdb_id: string | null;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  status: string;
  budget: number;
  revenue: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  link?: string;
}

export interface MovieQuote {
  quote: string;
  movieId: number;
  title: string;
  year: number;
  character?: string;
}

export interface SearchResult {
  movie: Movie;
  confidence: number;
  matchSource: "subtitles" | "quotes" | "tmdb" | "combined" | "description";
  matchedLine?: string;
  timestampMs?: number;
  watchProviders?: WatchProviders | null;
}

export interface TranscriptionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export type AppMode = "listen" | "upload" | "type" | "link";

export interface TMDBSearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};
