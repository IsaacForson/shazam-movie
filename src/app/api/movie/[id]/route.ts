import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getMovieWatchProviders, getSimilarMovies } from "@/lib/tmdb";

function getRegion(request: NextRequest): string {
  const region = request.nextUrl.searchParams.get("region");
  if (region) return region.toUpperCase();
  const country = request.headers.get("x-vercel-ip-country");
  return country || "US";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);
    const region = getRegion(request);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const [details, providers, similar] = await Promise.all([
      getMovieDetails(movieId),
      getMovieWatchProviders(movieId, region),
      getSimilarMovies(movieId),
    ]);

    return NextResponse.json({
      details,
      providers,
      similar,
      region,
    });
  } catch (error) {
    console.error("Movie detail error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("401")) {
      return NextResponse.json(
        {
          error:
            "TMDB API key is invalid. Get a free key at themoviedb.org/settings/api and set TMDB_API_KEY in .env.local",
        },
        { status: 401 }
      );
    }
    if (message.includes("not configured")) {
      return NextResponse.json(
        { error: "TMDB API key is not configured. Set TMDB_API_KEY in .env.local" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
