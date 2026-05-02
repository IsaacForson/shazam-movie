import { Movie, MovieDetail, WatchProviders, TMDBSearchResponse } from "@/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key || key.startsWith("your_tmdb_")) {
    throw new Error("TMDB_API_KEY is not configured");
  }
  return key;
}

export function getImageUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "/no-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/w1280${path}`;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const data: TMDBSearchResponse = await res.json();
  return data.results;
}

export async function multiSearch(query: string): Promise<Movie[]> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB multi-search failed: ${res.status}`);

  const data = await res.json();
  return data.results
    .filter((r: { media_type: string }) => r.media_type === "movie")
    .map((r: Movie & { media_type: string }) => {
      const { ...movie } = r;
      return movie as Movie;
    });
}

export async function getMovieDetails(movieId: number): Promise<MovieDetail> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB movie details failed: ${res.status}`);

  return res.json();
}

export async function getMovieWatchProviders(movieId: number, country: string = "US"): Promise<WatchProviders | null> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return data.results?.[country] || null;
}

export async function getMoviesByIds(ids: number[]): Promise<Movie[]> {
  const apiKey = getApiKey();
  const movies = await Promise.all(
    ids.map(async (id) => {
      try {
        const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&language=en-US`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const detail: MovieDetail = await res.json();
        return {
          id: detail.id,
          title: detail.title,
          overview: detail.overview,
          poster_path: detail.poster_path,
          backdrop_path: detail.backdrop_path,
          release_date: detail.release_date,
          vote_average: detail.vote_average,
          vote_count: detail.vote_count,
          genre_ids: detail.genres.map((g) => g.id),
          popularity: detail.popularity,
          original_language: detail.original_language,
        } as Movie;
      } catch {
        return null;
      }
    })
  );
  return movies.filter((m): m is Movie => m !== null);
}

export async function getSimilarMovies(movieId: number): Promise<Movie[]> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/movie/${movieId}/similar?api_key=${apiKey}&language=en-US&page=1`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data: TMDBSearchResponse = await res.json();
  return data.results.slice(0, 6);
}

export async function getTrendingMovies(): Promise<Movie[]> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${apiKey}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data: TMDBSearchResponse = await res.json();
  return data.results.slice(0, 12);
}
