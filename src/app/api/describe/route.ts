import { NextRequest, NextResponse } from "next/server";
import {
  identifyMoviesFromText,
  candidatesToResults,
  hasLlmProvider,
} from "@/lib/movie-llm";

function getRegion(request: NextRequest): string {
  const region = request.nextUrl.searchParams.get("region");
  if (region) return region.toUpperCase();
  const country = request.headers.get("x-vercel-ip-country");
  return country || "US";
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Describe the movie in a sentence or two." },
        { status: 400 }
      );
    }

    if (!hasLlmProvider()) {
      return NextResponse.json(
        { error: "Description search is not configured. Set GROQ_API_KEY (or GEMINI_API_KEY)." },
        { status: 503 }
      );
    }

    const trimmed = text.trim();
    const region = getRegion(request);

    const candidates = await identifyMoviesFromText(trimmed);
    const results = await candidatesToResults(candidates, region, "description");

    return NextResponse.json({
      results,
      transcript: trimmed,
      matchCount: results.length,
    });
  } catch (error) {
    console.error("Describe error:", error);
    return NextResponse.json(
      { error: "Failed to identify the movie. Please try again." },
      { status: 500 }
    );
  }
}
