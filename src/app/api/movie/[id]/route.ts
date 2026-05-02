import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getMovieWatchProviders, getSimilarMovies } from "@/lib/tmdb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const [details, providers, similar] = await Promise.all([
      getMovieDetails(movieId),
      getMovieWatchProviders(movieId),
      getSimilarMovies(movieId),
    ]);

    return NextResponse.json({
      details,
      providers,
      similar,
    });
  } catch (error) {
    console.error("Movie detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
