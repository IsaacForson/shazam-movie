import { NextRequest, NextResponse } from "next/server";
import { searchMovies, getMovieWatchProviders } from "@/lib/tmdb";
import { Movie, SearchResult } from "@/types";

function getRegion(request: NextRequest): string {
  const region = request.nextUrl.searchParams.get("region");
  if (region) return region.toUpperCase();
  const country = request.headers.get("x-vercel-ip-country");
  return country || "US";
}

interface Candidate {
  title: string;
  year: number;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_SCORE: Record<Candidate["confidence"], number> = {
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

const SYSTEM_PROMPT = `A user is describing a movie in their own words (plot, scene, characters, or vibe). Identify the most likely films.
Return ONLY valid JSON in this exact shape:
{ "candidates": [ { "title": string, "year": number, "confidence": "high" | "medium" | "low" } ] }
Rules:
- Up to 3 candidates, most likely first.
- Use the film's real, official English title and release year.
- Do NOT invent films. If you are unsure, return fewer candidates or an empty array.
- confidence reflects how certain you are it is that exact film.`;

function parseCandidates(content: string): Candidate[] {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : parsed.candidates;
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => c && typeof c.title === "string")
      .map((c) => ({
        title: c.title,
        year: typeof c.year === "number" ? c.year : 0,
        confidence: ["high", "medium", "low"].includes(c.confidence) ? c.confidence : "low",
      }))
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function askGroq(text: string, apiKey: string): Promise<Candidate[]> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq describe error:", err);
    throw new Error("LLM request failed");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  return parseCandidates(content);
}

function pickBestMatch(results: Movie[], year: number): Movie | null {
  if (results.length === 0) return null;
  if (year > 0) {
    const yearMatch = results.find((m) => {
      const movieYear = parseInt(m.release_date?.split("-")[0] || "0", 10);
      return Math.abs(movieYear - year) <= 1;
    });
    if (yearMatch) return yearMatch;
  }
  return results[0];
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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Description search is not configured. Set GROQ_API_KEY." },
        { status: 503 }
      );
    }

    const trimmed = text.trim();
    const region = getRegion(request);

    const candidates = await askGroq(trimmed, apiKey);

    const results: SearchResult[] = [];
    const seen = new Set<number>();

    for (const candidate of candidates) {
      let tmdbResults: Movie[] = [];
      try {
        tmdbResults = await searchMovies(candidate.title);
      } catch (err) {
        console.error("TMDb verify error:", err);
        continue;
      }

      const best = pickBestMatch(tmdbResults, candidate.year);
      if (!best || seen.has(best.id)) continue;
      seen.add(best.id);

      results.push({
        movie: best,
        confidence: CONFIDENCE_SCORE[candidate.confidence],
        matchSource: "description",
      });
    }

    // Region-aware watch providers for the top result only.
    if (results.length > 0) {
      try {
        const providers = await getMovieWatchProviders(results[0].movie.id, region);
        results[0].watchProviders = providers;
      } catch {
        // non-fatal
      }
    }

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
