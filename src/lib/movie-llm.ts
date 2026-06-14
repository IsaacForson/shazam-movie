import { searchMovies, getMovieWatchProviders } from "@/lib/tmdb";
import { Movie, SearchResult } from "@/types";

export interface Candidate {
  title: string;
  year: number;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_SCORE: Record<Candidate["confidence"], number> = {
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

const SYSTEM_PROMPT = `You identify movies from user input. The input is EITHER a line of dialogue/quote from a film OR a description of a plot, scene, characters, or vibe.
Search the web when helpful so you can recognize recent and obscure films, not just well-known ones.
Return ONLY valid JSON in this exact shape, with no extra commentary:
{ "candidates": [ { "title": string, "year": number, "confidence": "high" | "medium" | "low" } ] }
Rules:
- Up to 3 candidates, most likely first.
- Use each film's real, official English title and release year.
- Do NOT invent films. If unsure, return fewer candidates or an empty array.
- confidence reflects how certain you are it is that exact film.`;

/**
 * Web-search-capable LLM movie identification.
 * Defaults to Groq Compound (built-in web search, reuses GROQ_API_KEY).
 * If GEMINI_API_KEY is set, uses Gemini with Google Search grounding instead.
 */
export async function identifyMoviesFromText(text: string): Promise<Candidate[]> {
  if (process.env.GEMINI_API_KEY) {
    return askGemini(text, process.env.GEMINI_API_KEY);
  }
  if (process.env.GROQ_API_KEY) {
    return askGroqCompound(text, process.env.GROQ_API_KEY);
  }
  throw new Error("No LLM provider configured (set GROQ_API_KEY or GEMINI_API_KEY)");
}

export function hasLlmProvider(): boolean {
  return !!process.env.GEMINI_API_KEY || !!process.env.GROQ_API_KEY;
}

async function askGroqCompound(text: string, apiKey: string): Promise<Candidate[]> {
  // compound-mini does web search but with lighter tool use, so it stays under
  // the per-request token cap that the full compound model can blow past.
  try {
    const content = await groqChat(apiKey, {
      model: "groq/compound-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });
    const candidates = parseCandidates(content);
    if (candidates.length > 0) return candidates;
  } catch (err) {
    console.error("Groq compound error:", err);
  }

  // Fallback: plain Llama (no web search). Older knowledge, but never a 500.
  try {
    const content = await groqChat(apiKey, {
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });
    return parseCandidates(content);
  } catch (err) {
    console.error("Groq fallback error:", err);
    return [];
  }
}

async function groqChat(
  apiKey: string,
  body: Record<string, unknown>
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Groq request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function askGemini(text: string, apiKey: string): Promise<Candidate[]> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser input: ${text}` }] },
        ],
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini grounding error:", err);
    throw new Error("LLM request failed");
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const content = parts.map((p: { text?: string }) => p.text || "").join("");
  return parseCandidates(content);
}

function parseCandidates(content: string): Candidate[] {
  // Web-search models often wrap JSON in prose; grab the first JSON object/array.
  const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  const raw = (match ? match[0] : content).trim();

  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.candidates;
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => c && typeof c.title === "string")
      .map((c) => ({
        title: c.title,
        year: typeof c.year === "number" ? c.year : 0,
        confidence: ["high", "medium", "low"].includes(c.confidence)
          ? c.confidence
          : "low",
      }))
      .slice(0, 3);
  } catch {
    return [];
  }
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

/**
 * Verifies LLM candidates against TMDb (for posters/metadata) and attaches
 * region-aware watch providers to the top result.
 */
export async function candidatesToResults(
  candidates: Candidate[],
  region: string,
  matchSource: SearchResult["matchSource"]
): Promise<SearchResult[]> {
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
      matchSource,
    });
  }

  if (results.length > 0) {
    try {
      results[0].watchProviders = await getMovieWatchProviders(results[0].movie.id, region);
    } catch {
      // non-fatal
    }
  }

  return results;
}
