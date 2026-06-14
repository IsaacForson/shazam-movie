import { NextRequest, NextResponse } from "next/server";
import { searchQuotes, mergeResults } from "@/lib/search";
import { searchSubtitles } from "@/lib/subtitle-search";
import { getMoviesByIds, getMovieWatchProviders } from "@/lib/tmdb";
import {
  identifyMoviesFromText,
  candidatesToResults,
  hasLlmProvider,
} from "@/lib/movie-llm";
import { Movie, WatchProviders } from "@/types";

function getRegion(request: NextRequest): string {
  const region = request.nextUrl.searchParams.get("region");
  if (region) return region.toUpperCase();
  const country = request.headers.get("x-vercel-ip-country");
  return country || "US";
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide some text to search" },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    const region = getRegion(request);

    const subtitleMatches = searchSubtitles(trimmed);
    const quoteMatches = searchQuotes(trimmed);

    const movieIds = new Set<number>();
    for (const m of subtitleMatches) movieIds.add(m.tmdbId);
    for (const m of quoteMatches) movieIds.add(m.quote.movieId);

    let tmdbResults: Movie[] = [];
    const hasTmdbKey =
      process.env.TMDB_API_KEY &&
      !process.env.TMDB_API_KEY.startsWith("your_tmdb_");

    if (hasTmdbKey && movieIds.size > 0) {
      try {
        tmdbResults = await getMoviesByIds([...movieIds].slice(0, 10));
      } catch (err) {
        console.error("TMDB fetch error:", err);
      }
    }

    const watchProvidersMap = new Map<number, WatchProviders | null>();
    if (hasTmdbKey && tmdbResults.length > 0) {
      const topIds = tmdbResults.slice(0, 3).map((m) => m.id);
      await Promise.all(
        topIds.map(async (id) => {
          try {
            const providers = await getMovieWatchProviders(id, region);
            watchProvidersMap.set(id, providers);
          } catch {
            watchProvidersMap.set(id, null);
          }
        })
      );
    }

    let results = mergeResults(
      subtitleMatches,
      quoteMatches,
      tmdbResults,
      watchProvidersMap
    );

    // The local subtitle/quote corpus is small and misses recent or obscure
    // films. When it finds nothing, fall back to a web-search-capable LLM that
    // can identify the line of dialogue from across the internet.
    if (results.length === 0 && hasLlmProvider()) {
      try {
        const candidates = await identifyMoviesFromText(trimmed);
        results = await candidatesToResults(candidates, region, "web");
      } catch (err) {
        console.error("Web fallback error:", err);
      }
    }

    return NextResponse.json({
      results,
      transcript: trimmed,
      matchCount: results.length,
    });
  } catch (error) {
    console.error("Identify error:", error);
    return NextResponse.json(
      { error: "Failed to identify movie. Please try again." },
      { status: 500 }
    );
  }
}
