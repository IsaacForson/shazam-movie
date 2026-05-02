import { NextRequest, NextResponse } from "next/server";
import { searchQuotes, getSearchKeywords, mergeResults } from "@/lib/search";
import { searchMovies, getMoviesByIds } from "@/lib/tmdb";
import { Movie } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide some text to search" },
        { status: 400 }
      );
    }

    const quoteMatches = searchQuotes(text.trim());

    let tmdbResults: Movie[] = [];
    const hasTmdbKey =
      process.env.TMDB_API_KEY &&
      !process.env.TMDB_API_KEY.startsWith("your_tmdb_");

    if (hasTmdbKey) {
      try {
        const keywords = getSearchKeywords(text);
        const searches: Promise<Movie[]>[] = [];

        if (text.trim().length > 5) {
          searches.push(searchMovies(text.trim().slice(0, 100)));
        }

        if (keywords.length >= 2) {
          const keywordQuery = keywords.slice(0, 5).join(" ");
          searches.push(searchMovies(keywordQuery));
        }

        const quoteMovieIds = quoteMatches
          .slice(0, 5)
          .map((m) => m.quote.movieId);
        if (quoteMovieIds.length > 0) {
          searches.push(getMoviesByIds(quoteMovieIds));
        }

        const allResults = await Promise.all(searches);
        const seen = new Set<number>();
        for (const results of allResults) {
          for (const movie of results) {
            if (!seen.has(movie.id)) {
              seen.add(movie.id);
              tmdbResults.push(movie);
            }
          }
        }
      } catch (err) {
        console.error("TMDB search error:", err);
      }
    } else if (quoteMatches.length > 0) {
      try {
        const ids = quoteMatches.map((m) => m.quote.movieId);
        tmdbResults = await getMoviesByIds(ids);
      } catch {
        // TMDB not available, will use quote data only
      }
    }

    const results = mergeResults(quoteMatches, tmdbResults);

    return NextResponse.json({
      results,
      transcript: text.trim(),
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
